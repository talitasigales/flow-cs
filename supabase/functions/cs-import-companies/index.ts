// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const norm = (v: unknown) =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
const lower = (v: unknown) => norm(v).toLowerCase();

interface InRow {
  rowIndex: number;
  company_name: string;
  company_segment?: string;
  company_status?: string;
  company_start_date?: string;
  company_notes?: string;
  owner_email?: string;
  contact_name?: string;
  contact_email?: string;
  contact_role?: string;
  contact_phone?: string;
  contact_influence?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // --- Auth (manual JWT validation) ---
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Missing token" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userResp, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userResp?.user) return json(401, { error: "Invalid token" });
  const userId = userResp.user.id;

  // Must be cs_admin or global admin
  const { data: hasAdmin } = await admin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  let allowed = !!hasAdmin;
  if (!allowed) {
    const { data: csA } = await admin.rpc("is_cs_admin", { _user_id: userId });
    allowed = !!csA;
  }
  if (!allowed) return json(403, { error: "Forbidden" });

  // --- Payload ---
  let body: { rows?: InRow[]; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) return json(400, { error: "No rows provided" });
  if (rows.length > 1000)
    return json(400, { error: "Batch too large (max 1000 rows per call)" });

  const dryRun = !!body.dryRun;
  const errors: { row: number; message: string }[] = [];
  const ownersNotFound = new Set<string>();

  // --- 1. Resolve owners ---
  const ownerEmails = Array.from(
    new Set(rows.map((r) => lower(r.owner_email)).filter(Boolean)),
  );
  const ownerMap = new Map<string, string>(); // lower(email) -> user_id
  if (ownerEmails.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("user_id, email")
      .in("email", ownerEmails);
    for (const p of profs ?? []) {
      if (p.email) ownerMap.set(lower(p.email), p.user_id);
    }
    for (const e of ownerEmails) if (!ownerMap.has(e)) ownersNotFound.add(e);
  }

  // --- 2. Group companies (first occurrence wins) ---
  const companyByKey = new Map<
    string,
    {
      key: string;
      name: string;
      segment: string | null;
      status: string;
      start_date: string | null;
      notes: string | null;
      owner_user_id: string | null;
      rowIndex: number;
    }
  >();

  for (const r of rows) {
    const name = norm(r.company_name);
    if (!name) {
      errors.push({ row: r.rowIndex, message: "company_name vazio" });
      continue;
    }
    const key = lower(name);
    if (!companyByKey.has(key)) {
      const ownerKey = lower(r.owner_email);
      companyByKey.set(key, {
        key,
        name,
        segment: norm(r.company_segment) || null,
        status: norm(r.company_status) || "onboarding",
        start_date: norm(r.company_start_date) || null,
        notes: norm(r.company_notes) || null,
        owner_user_id: ownerKey ? ownerMap.get(ownerKey) ?? null : null,
        rowIndex: r.rowIndex,
      });
    }
  }

  // --- 3. Lookup existing companies ---
  const allKeys = Array.from(companyByKey.keys());
  const existingMap = new Map<string, string>(); // key -> id
  // Lookup in chunks of 200 names
  for (let i = 0; i < allKeys.length; i += 200) {
    const slice = allKeys.slice(i, i + 200);
    const { data } = await admin
      .from("cs_companies")
      .select("id, name")
      .in("name", slice.map((k) => companyByKey.get(k)!.name));
    // Also try case-insensitive match via ilike fallback
    for (const c of data ?? []) existingMap.set(lower(c.name), c.id);
  }
  // Catch case-only differences with a separate ilike pass on missing keys
  const missingKeys = allKeys.filter((k) => !existingMap.has(k));
  for (const k of missingKeys) {
    const { data } = await admin
      .from("cs_companies")
      .select("id, name")
      .ilike("name", companyByKey.get(k)!.name)
      .limit(1);
    if (data && data[0]) existingMap.set(k, data[0].id);
  }

  // --- 4. Insert new companies ---
  let companiesCreated = 0;
  const companiesReused = existingMap.size;
  const toInsert = allKeys
    .filter((k) => !existingMap.has(k))
    .map((k) => {
      const c = companyByKey.get(k)!;
      return {
        name: c.name,
        segment: c.segment,
        status: c.status,
        start_date: c.start_date,
        notes: c.notes,
        owner_user_id: c.owner_user_id,
        created_by: userId,
      };
    });

  if (!dryRun && toInsert.length > 0) {
    // Insert in chunks of 200
    for (let i = 0; i < toInsert.length; i += 200) {
      const chunk = toInsert.slice(i, i + 200);
      const { data, error } = await admin
        .from("cs_companies")
        .insert(chunk)
        .select("id, name");
      if (error) {
        errors.push({ row: 0, message: `Erro inserindo empresas: ${error.message}` });
        continue;
      }
      for (const c of data ?? []) {
        existingMap.set(lower(c.name), c.id);
        companiesCreated++;
      }
    }
  } else if (dryRun) {
    companiesCreated = toInsert.length;
  }

  // --- 5. Contacts ---
  let contactsCreated = 0;
  let contactsSkipped = 0;

  if (!dryRun) {
    // Build all contact candidates with resolved company_id
    type Cand = {
      company_id: string;
      name: string;
      role_title: string | null;
      email: string | null;
      phone: string | null;
      influence: string;
      rowIndex: number;
    };
    const candidates: Cand[] = [];
    for (const r of rows) {
      const cname = norm(r.company_name);
      if (!cname) continue;
      const contactName = norm(r.contact_name);
      if (!contactName) continue; // skip rows without contact
      const cid = existingMap.get(lower(cname));
      if (!cid) {
        errors.push({
          row: r.rowIndex,
          message: `Empresa não encontrada após insert: ${cname}`,
        });
        continue;
      }
      candidates.push({
        company_id: cid,
        name: contactName,
        role_title: norm(r.contact_role) || null,
        email: norm(r.contact_email) || null,
        phone: norm(r.contact_phone) || null,
        influence: norm(r.contact_influence) || "usuario",
        rowIndex: r.rowIndex,
      });
    }

    // Lookup existing contacts (by company_id + lower(email)) in batches
    const companyIds = Array.from(new Set(candidates.map((c) => c.company_id)));
    const existingContacts = new Set<string>(); // key = company_id|lower(email)
    for (let i = 0; i < companyIds.length; i += 200) {
      const slice = companyIds.slice(i, i + 200);
      const { data } = await admin
        .from("cs_contacts")
        .select("company_id, email")
        .in("company_id", slice)
        .not("email", "is", null);
      for (const c of data ?? []) {
        if (c.email) existingContacts.add(`${c.company_id}|${lower(c.email)}`);
      }
    }

    // Dedup within the batch too (same company+email twice in the file)
    const seenInBatch = new Set<string>();
    const toInsertContacts: Omit<Cand, "rowIndex">[] = [];
    for (const c of candidates) {
      if (c.email) {
        const k = `${c.company_id}|${lower(c.email)}`;
        if (existingContacts.has(k) || seenInBatch.has(k)) {
          contactsSkipped++;
          continue;
        }
        seenInBatch.add(k);
      }
      const { rowIndex: _r, ...rest } = c;
      toInsertContacts.push(rest);
    }

    for (let i = 0; i < toInsertContacts.length; i += 500) {
      const chunk = toInsertContacts.slice(i, i + 500);
      const { error, count } = await admin
        .from("cs_contacts")
        .insert(chunk, { count: "exact" });
      if (error) {
        errors.push({ row: 0, message: `Erro inserindo contatos: ${error.message}` });
        continue;
      }
      contactsCreated += count ?? chunk.length;
    }
  } else {
    // dryRun: just count distinct contacts that would be created
    const seen = new Set<string>();
    for (const r of rows) {
      const cname = norm(r.company_name);
      const contactName = norm(r.contact_name);
      if (!cname || !contactName) continue;
      const email = lower(r.contact_email);
      const key = email ? `${lower(cname)}|${email}` : `${lower(cname)}|${contactName}|${r.rowIndex}`;
      if (seen.has(key)) {
        contactsSkipped++;
        continue;
      }
      seen.add(key);
      contactsCreated++;
    }
  }

  return json(200, {
    dryRun,
    companiesCreated,
    companiesReused,
    contactsCreated,
    contactsSkipped,
    ownersNotFound: Array.from(ownersNotFound),
    errors,
  });
});
