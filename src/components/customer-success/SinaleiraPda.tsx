import { useMemo, useState } from "react";
import { useSinaleiraSnapshot, SinaleiraSignal } from "@/hooks/useSinaleiraSnapshot";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Filter, X, Info, AlertTriangle, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const STATUS_CONFIG: Record<SinaleiraSignal, { label: string; dot: string; badge: string }> = {
  ok:       { label: "Verde",     dot: "bg-green-500",  badge: "bg-green-500/15 text-green-500 border-green-500/30" },
  warning:  { label: "Amarelo",   dot: "bg-yellow-400", badge: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  critical: { label: "Vermelho",  dot: "bg-red-500",    badge: "bg-destructive/15 text-destructive border-destructive/30" },
  unknown:  { label: "Sem dados", dot: "bg-slate-500",  badge: "bg-muted text-muted-foreground border-border" },
};

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
const fmtDate = (s: string | null) => (s ? new Date(s + "T00:00:00").toLocaleDateString("pt-BR") : "—");

export function SinaleiraPda() {
  const { loading, error, rows, lastUpdated, refresh, importSnapshot } = useSinaleiraSnapshot();
  const { isAdmin } = useIsAdmin();
  const [importing, setImporting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SinaleiraSignal>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlyAlert, setOnlyAlert] = useState(false);
  const [expFrom, setExpFrom] = useState("");
  const [expTo, setExpTo] = useState("");
  const [creditsMin, setCreditsMin] = useState("");
  const [creditsMax, setCreditsMax] = useState("");

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setOnlyAlert(false);
    setExpFrom(""); setExpTo(""); setCreditsMin(""); setCreditsMax("");
  };

  const hasFilters =
    search !== "" || statusFilter !== "all" || typeFilter !== "all" || onlyAlert ||
    expFrom !== "" || expTo !== "" || creditsMin !== "" || creditsMax !== "";

  const accountTypes = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => r.account_type && s.add(r.account_type));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cMin = creditsMin === "" ? -Infinity : Number(creditsMin);
    const cMax = creditsMax === "" ? Infinity : Number(creditsMax);
    const dFrom = expFrom ? new Date(expFrom).getTime() : null;
    const dTo = expTo ? new Date(expTo).getTime() + 86400000 - 1 : null;

    return rows.filter(r => {
      if (q && !r.account_name.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && r.signal !== statusFilter) return false;
      if (typeFilter !== "all" && r.account_type !== typeFilter) return false;
      if (onlyAlert && !(r.alert && r.alert.toUpperCase() !== "OK")) return false;
      if (r.available_credits < cMin || r.available_credits > cMax) return false;
      if (dFrom !== null || dTo !== null) {
        if (!r.effectiveExpiration) return false;
        const t = new Date(r.effectiveExpiration).getTime();
        if (dFrom !== null && t < dFrom) return false;
        if (dTo !== null && t > dTo) return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, typeFilter, onlyAlert, creditsMin, creditsMax, expFrom, expTo]);

  const summary = {
    total:    filtered.length,
    ok:       filtered.filter(r => r.signal === "ok").length,
    warning:  filtered.filter(r => r.signal === "warning").length,
    critical: filtered.filter(r => r.signal === "critical").length,
    unknown:  filtered.filter(r => r.signal === "unknown").length,
    alerts:   filtered.filter(r => r.alert && r.alert.toUpperCase() !== "OK").length,
  };

  const order: Record<SinaleiraSignal, number> = { critical: 0, warning: 1, ok: 2, unknown: 3 };
  const sorted = [...filtered].sort((a, b) => {
    if (order[a.signal] !== order[b.signal]) return order[a.signal] - order[b.signal];
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  const handleImport = async () => {
    setImporting(true);
    try {
      const res: any = await importSnapshot();
      toast.success(`Snapshot atualizado: ${res?.imported ?? 0} bases importadas.`);
    } catch (e: any) {
      toast.error(`Falha ao importar: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" /> Carregando Sinaleira...
      </div>
    );
  }
  if (error) {
    return (
      <Card><CardContent className="p-6 text-destructive">
        Erro ao carregar snapshot: {error}
        <div className="mt-3"><Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="w-4 h-4 mr-2" />Tentar novamente</Button></div>
      </CardContent></Card>
    );
  }

  const lights = [
    { status: "ok"       as const, value: summary.ok,       desc: "operação saudável" },
    { status: "warning"  as const, value: summary.warning,  desc: "atenção ao consumo" },
    { status: "critical" as const, value: summary.critical, desc: "risco de não usar saldo / expiração" },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Sinaleira PDA
              <Tooltip>
                <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs leading-relaxed">
                  <p>Snapshot importado da planilha de bases PDA. A Sinaleira (🟢🟡🔴) e os alertas vêm direto da planilha.</p>
                </TooltipContent>
              </Tooltip>
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} bases
              {lastUpdated && ` · Dados de ${fmtDate(lastUpdated)}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-2" /> Recarregar
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={handleImport} disabled={importing}>
                <Download className={`w-4 h-4 mr-2 ${importing ? "animate-spin" : ""}`} />
                {importing ? "Importando..." : "Importar da planilha"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {lights.map(({ status, value, desc }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <Card key={status}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${cfg.dot} shadow-inner`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{cfg.label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(summary.unknown > 0 || summary.alerts > 0) && (
          <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
            {summary.unknown > 0 && <span>+ {summary.unknown} sem sinaleira definida</span>}
            {summary.alerts > 0 && (
              <span className="flex items-center gap-1 text-yellow-500">
                <AlertTriangle className="w-3 h-3" /> {summary.alerts} com alerta ativo
              </span>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Buscar conta</Label>
                <Input placeholder="Nome da conta" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sinaleira</Label>
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ok">🟢 Verde</SelectItem>
                    <SelectItem value="warning">🟡 Amarelo</SelectItem>
                    <SelectItem value="critical">🔴 Vermelho</SelectItem>
                    <SelectItem value="unknown">Sem dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de conta</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {accountTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={onlyAlert} onCheckedChange={v => setOnlyAlert(!!v)} />
                  Só com alerta
                </label>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expira de</Label>
                <Input type="date" value={expFrom} onChange={e => setExpFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expira até</Label>
                <Input type="date" value={expTo} onChange={e => setExpTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Créditos mín.</Label>
                <Input type="number" min={0} value={creditsMin} onChange={e => setCreditsMin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Créditos máx.</Label>
                <Input type="number" min={0} value={creditsMax} onChange={e => setCreditsMax(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Exibindo {filtered.length} de {rows.length} bases</span>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" /> Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bases</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Consumo último mês</TableHead>
                  <TableHead className="text-right">Total utilizado</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sinaleira / Alerta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma base encontrada. {isAdmin && rows.length === 0 && "Clique em 'Importar da planilha' para carregar os dados."}
                    </TableCell>
                  </TableRow>
                ) : sorted.map(r => {
                  const cfg = STATUS_CONFIG[r.signal];
                  const hasAlert = r.alert && r.alert.toUpperCase() !== "OK";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.account_name}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.available_credits)}</TableCell>
                      <TableCell className="text-right">{fmt(r.last_month_consumption)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmt(r.used_credits_total)}</TableCell>
                      <TableCell>
                        <p className="text-sm">{fmtDate(r.effectiveExpiration)}</p>
                        {isFinite(r.daysUntilExpiry) && (
                          <p className={`text-xs ${r.daysUntilExpiry <= 30 ? "text-destructive" : "text-muted-foreground"}`}>
                            {r.daysUntilExpiry > 0 ? `${r.daysUntilExpiry} dias restantes` : "Expirada"}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.account_type || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className={cfg.badge}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${cfg.dot}`} />
                            {cfg.label}
                          </Badge>
                          {hasAlert && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" /> {r.alert}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
