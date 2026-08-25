import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, RefreshCw, Mail, MessageCircle } from "lucide-react";

type Log = {
  id: string;
  class_id: string | null;
  program_id: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  channel: string;
  message_type: string;
  status: string;
  error_message: string | null;
  session_date: string | null;
  sent_at: string | null;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  welcome: "Boas-vindas",
  reminder_24h: "Lembrete 24h",
  reminder_1h: "Lembrete 1h",
  reminder_30min: "Lembrete 30min",
  dilemmas: "Dilemas de Gestão",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "Enviado",
  failed: "Falhou",
  processing: "Em processamento",
};

const STATUS_CLASS: Record<string, string> = {
  sent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
  processing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export default function AdminCommunications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [classes, setClasses] = useState<Record<string, { name: string; program: string }>>({});

  const [classFilter, setClassFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      const ok = !!data;
      setIsAdmin(ok);
      if (!ok) navigate("/dashboard");
      else load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function load() {
    setLoading(true);
    const [{ data: logData, error }, { data: classData }] = await Promise.all([
      (supabase as any)
        .from("message_delivery_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      (supabase as any)
        .from("program_classes")
        .select("id, name, programs(name)"),
    ]);
    if (error) toast.error("Erro ao carregar envios");
    setLogs((logData as Log[]) || []);
    const map: Record<string, { name: string; program: string }> = {};
    for (const c of (classData as any[]) || []) {
      map[c.id] = { name: c.name, program: c.programs?.name || "Programa" };
    }
    setClasses(map);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (classFilter !== "all" && l.class_id !== classFilter) return false;
      if (channelFilter !== "all" && l.channel !== channelFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (q) {
        const hay = `${l.recipient_name || ""} ${l.recipient_email || ""} ${l.recipient_phone || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, classFilter, channelFilter, statusFilter, search]);

  const counts = useMemo(() => ({
    total: filtered.length,
    sent: filtered.filter((l) => l.status === "sent").length,
    failed: filtered.filter((l) => l.status === "failed").length,
    processing: filtered.filter((l) => l.status === "processing").length,
  }), [filtered]);

  const classOptions = useMemo(
    () => Object.entries(classes).sort((a, b) => a[1].name.localeCompare(b[1].name)),
    [classes],
  );

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";

  if (isAdmin === null) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Acompanhamento de envios</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Status dos e-mails e mensagens de WhatsApp por turma e por aluno.
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: counts.total, cls: "text-foreground" },
            { label: "Enviados", value: counts.sent, cls: "text-emerald-400" },
            { label: "Falharam", value: counts.failed, cls: "text-red-400" },
            { label: "Em processamento", value: counts.processing, cls: "text-yellow-400" },
          ].map((c) => (
            <Card key={c.label} className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-2xl font-bold ${c.cls}`}>{c.value}</p>
            </Card>
          ))}
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger><SelectValue placeholder="Turma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {classOptions.map(([id, c]) => (
                  <SelectItem key={id} value={id}>{c.program} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="processing">Em processamento</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Buscar aluno, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum envio registrado com esses filtros.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.recipient_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {l.recipient_email || l.recipient_phone || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.class_id && classes[l.class_id]
                        ? `${classes[l.class_id].program} — ${classes[l.class_id].name}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        {l.channel === "whatsapp"
                          ? <MessageCircle className="w-4 h-4" />
                          : <Mail className="w-4 h-4" />}
                        {l.channel === "whatsapp" ? "WhatsApp" : "E-mail"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{TYPE_LABEL[l.message_type] || l.message_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_CLASS[l.status] || ""}
                        title={l.error_message || undefined}
                      >
                        {STATUS_LABEL[l.status] || l.status}
                      </Badge>
                      {l.status === "failed" && l.error_message && (
                        <p className="text-xs text-red-400 mt-1 max-w-[240px] truncate" title={l.error_message}>
                          {l.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmt(l.sent_at || l.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
