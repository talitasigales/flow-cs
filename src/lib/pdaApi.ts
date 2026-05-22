const BASE_URL = "https://integrations.apispda.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const res = await fetch(`${BASE_URL}/api/identity/v1/Users/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: import.meta.env.VITE_PDA_USER,
      password: import.meta.env.VITE_PDA_PASS,
    }),
  });
  if (!res.ok) throw new Error(`Login PDA falhou (${res.status})`);
  const data = await res.json();
  cachedToken = { value: data.token, expiresAt: Date.now() + 3500 * 1000 };
  return data.token;
}

export async function getAccountBases(token: string) {
  const res = await fetch(`${BASE_URL}/api/identity/v1/Accounts/AccountSubBaseDetail`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`AccountSubBaseDetail falhou (${res.status})`);
  return res.json();
}

export async function getCreditBalance(token: string, baseId: string) {
  const res = await fetch(`${BASE_URL}/api/credit/v1/CreditBalance/base/${baseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`CreditBalance falhou (${res.status})`);
  return res.json();
}

export async function getCreditMovements(token: string) {
  const res = await fetch(`${BASE_URL}/api/credit/v1/Credit/CreditConsumeMovement`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`CreditConsumeMovement falhou (${res.status})`);
  return res.json();
}
