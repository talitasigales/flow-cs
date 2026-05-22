import { useSinaleiraPda, SinaleiraStatus } from "@/hooks/useSinaleiraPda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Filter, X, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_CONFIG: Record<SinaleiraStatus, { label: string; dot: string; badge: string }> = {
  ok:       { label: "Verde",    dot: "bg-green-500",  badge: "bg-green-500/15 text-green-500 border-green-500/30" },
  warning:  { label: "Amarelo",  dot: "bg-yellow-400", badge: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  critical: { label: "Vermelho", dot: "bg-red-500",    badge: "bg-destructive/15 text-destructive border-destructive/30" },
  expired:  { label: "Expirado", dot: "bg-gray-400",   badge: "bg-muted text-muted-foreground border-border" },
  unknown:  { label: "Sem dados", dot: "bg-slate-500", badge: "bg-muted text-muted-foreground border-border" },
};

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");

export function SinaleiraPda() {
  const { loading, error, bases, movements, lastUpdated, refresh } = useSinaleiraPda();
  const [selectedBase, setSelectedBase] = useState("all");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SinaleiraStatus>("all");
  const [expFrom, setExpFrom] = useState("");
  const [expTo, setExpTo] = useState("");
  const [creditsMin, setCreditsMin] = useState("");
  const [creditsMax, setCreditsMax] = useState("");
  const [ratioMin, setRatioMin] = useState("");
  const [ratioMax, setRatioMax] = useState("");

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all");
    setExpFrom(""); setExpTo("");
    setCreditsMin(""); setCreditsMax("");
    setRatioMin(""); setRatioMax("");
  };

  const hasFilters =
    search !== "" || statusFilter !== "all" ||
    expFrom !== "" || expTo !== "" ||
    creditsMin !== "" || creditsMax !== "" ||
    ratioMin !== "" || ratioMax !== "";

  const filteredBases = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cMin = creditsMin === "" ? -Infinity : Number(creditsMin);
    const cMax = creditsMax === "" ? Infinity : Number(creditsMax);
    const rMin = ratioMin === "" ? -Infinity : Number(ratioMin);
    const rMax = ratioMax === "" ? Infinity : Number(ratioMax);
    const dFrom = expFrom ? new Date(expFrom).getTime() : null;
    const dTo = expTo ? new Date(expTo).getTime() + 86400000 - 1 : null;

    return bases.filter((b) => {
      if (q && !`${b.baseName} ${b.accountName}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (b.availableCredits < cMin || b.availableCredits > cMax) return false;
      if (ratioMin !== "" || ratioMax !== "") {
        if (b.consumptionRatio === null) return false;
        const pct = b.consumptionRatio * 100;
        if (pct < rMin || pct > rMax) return false;
      }
      if (dFrom !== null || dTo !== null) {
        if (!b.expirationDate) return false;
        const t = new Date(b.expirationDate).getTime();
        if (dFrom !== null && t < dFrom) return false;
        if (dTo !== null && t > dTo) return false;
      }
      return true;
    });
  }, [bases, search, statusFilter, expFrom, expTo, creditsMin, creditsMax, ratioMin, ratioMax]);

  const summary = {
    total:    filteredBases.length,
    ok:       filteredBases.filter((b) => b.status === "ok").length,
    warning:  filteredBases.filter((b) => b.status === "warning").length,
    critical: filteredBases.filter((b) => b.status === "critical").length,
    expired:  filteredBases.filter((b) => b.status === "expired").length,
    unknown:  filteredBases.filter((b) => b.status === "unknown").length,
  };

  const filteredMovements =
    selectedBase === "all" ? movements : movements.filter((m) => m.baseId === selectedBase);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Carregando Sinaleira PDA...
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          Erro ao conectar com a API PDA: {error}
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lights = [
    { status: "ok"       as const, value: summary.ok,       desc: "consumo acima do necessário" },
    { status: "warning"  as const, value: summary.warning,  desc: "consumo no ritmo da meta" },
    { status: "critical" as const, value: summary.critical, desc: "saldo vai sobrar (subutilização)" },
  ];

  const order: Record<SinaleiraStatus, number> = { expired: 0, critical: 1, warning: 2, ok: 3, unknown: 4 };
  const sortedBases = [...filteredBases].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Sinaleira PDA
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs leading-relaxed">
                  <p className="font-semibold mb-1">Lógica:</p>
                  <p>Meta Mensal = Saldo Atual ÷ Meses Restantes</p>
                  <p>Ritmo = Consumo Último Mês ÷ Meta Mensal</p>
                  <ul className="mt-2 space-y-0.5">
                    <li>🟢 Verde: ritmo &gt; 110% — acelerando, vai recarregar</li>
                    <li>🟡 Amarelo: ritmo 90–110% — no exato</li>
                    <li>🔴 Vermelho: ritmo &lt; 90% — saldo vai sobrar</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </h2>
            <p className="text-sm text-muted-foreground">
              Ritmo de consumo vs meta mensal por base
              {lastUpdated && ` · Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR")}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refresh(false)}>
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => refresh(true)} title="Ignora o cache e busca direto na PDA (use com moderação)">
              Forçar
            </Button>
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

        {(summary.expired > 0 || summary.unknown > 0) && (
          <div className="text-xs text-muted-foreground">
            + {summary.expired} expirada(s) · {summary.unknown} sem dados suficientes
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Buscar base</Label>
                <Input
                  placeholder="Nome da base ou conta"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sinaleira</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ok">Verde</SelectItem>
                    <SelectItem value="warning">Amarelo</SelectItem>
                    <SelectItem value="critical">Vermelho</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="unknown">Sem dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expira de</Label>
                <Input type="date" value={expFrom} onChange={(e) => setExpFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expira até</Label>
                <Input type="date" value={expTo} onChange={(e) => setExpTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Créditos mín.</Label>
                <Input type="number" min={0} value={creditsMin} onChange={(e) => setCreditsMin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Créditos máx.</Label>
                <Input type="number" min={0} value={creditsMax} onChange={(e) => setCreditsMax(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ritmo mín. (%)</Label>
                <Input type="number" min={0} value={ratioMin} onChange={(e) => setRatioMin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ritmo máx. (%)</Label>
                <Input type="number" min={0} value={ratioMax} onChange={(e) => setRatioMax(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Exibindo {filteredBases.length} de {bases.length} bases
              </span>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" /> Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bases</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base / Conta</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Meta mensal</TableHead>
                  <TableHead>Consumo último mês</TableHead>
                  <TableHead>Ritmo</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Sinaleira</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma base encontrada.
                    </TableCell>
                  </TableRow>
                ) : sortedBases.map((base) => {
                  const cfg = STATUS_CONFIG[base.status] ?? STATUS_CONFIG.unknown;
                  const ratioPct = base.consumptionRatio !== null ? Math.round(base.consumptionRatio * 100) : null;
                  return (
                    <TableRow key={base.baseId}>
                      <TableCell>
                        <p className="font-medium">{base.baseName}</p>
                        <p className="text-xs text-muted-foreground">{base.accountName}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{fmt(base.availableCredits)}</span>
                        <span className="text-muted-foreground"> créditos</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {base.monthlyTarget > 0 ? (
                          <>
                            <span className="font-medium">{fmt(base.monthlyTarget)}</span>
                            <span className="text-muted-foreground"> /mês</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {base.lastMonthConsumption > 0 ? (
                          <span className="font-medium">{fmt(base.lastMonthConsumption)}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ratioPct !== null ? (
                          <Badge variant="outline" className={cfg.badge}>
                            {ratioPct}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {base.expirationDate ? new Date(base.expirationDate).toLocaleDateString("pt-BR") : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {base.daysUntilExpiry > 0 && isFinite(base.daysUntilExpiry)
                            ? `${base.daysUntilExpiry} dias restantes`
                            : "Expirada"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.badge}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${cfg.dot}`} />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Movimentações de crédito</CardTitle>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={selectedBase}
              onChange={(e) => setSelectedBase(e.target.value)}
            >
              <option value="all">Todas as bases</option>
              {bases.map((b) => (
                <option key={b.baseId} value={b.baseId}>{b.baseName}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Créditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma movimentação encontrada.
                    </TableCell>
                  </TableRow>
                ) : filteredMovements.slice(0, 50).map((mov, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">
                      {mov.date ? new Date(mov.date).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{mov.baseName || mov.baseId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mov.type}</TableCell>
                    <TableCell className="text-sm font-medium">{mov.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
