import { useSinaleiraPda, SinaleiraStatus } from "@/hooks/useSinaleiraPda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Filter, X, Info, AlertCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PdaBase } from "@/hooks/useSinaleiraPda";


const STATUS_CONFIG: Record<SinaleiraStatus, { label: string; dot: string; badge: string }> = {
  ok:       { label: "Verde",    dot: "bg-green-500",  badge: "bg-green-500/15 text-green-500 border-green-500/30" },
  warning:  { label: "Amarelo",  dot: "bg-yellow-400", badge: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  critical: { label: "Vermelho", dot: "bg-red-500",    badge: "bg-destructive/15 text-destructive border-destructive/30" },
  expired:  { label: "Expirado", dot: "bg-gray-400",   badge: "bg-muted text-muted-foreground border-border" },
  unknown:  { label: "Sem dados", dot: "bg-slate-500", badge: "bg-muted text-muted-foreground border-border" },
};

const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");

export function SinaleiraPda() {
  const { loading, error, bases, movements, movementsAvailable, lastUpdated, refresh } = useSinaleiraPda();
  const [selectedBase, setSelectedBase] = useState("all");
  const [drawerBase, setDrawerBase] = useState<PdaBase | null>(null);
  const movementsRef = useRef<HTMLDivElement>(null);

  const goToMovements = (baseId: string) => {
    setSelectedBase(baseId);
    setTimeout(() => movementsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const openDrawer = (base: PdaBase) => {
    setDrawerBase(base);
    setSelectedBase(base.baseId);
  };

  const drawerMovements = useMemo(
    () =>
      drawerBase
        ? movements
            .filter((m) => m.baseId === drawerBase.baseId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [],
    [drawerBase, movements],
  );


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

        {!movementsAvailable && !loading && (
          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500">Sem dados de movimentação</p>
                <p className="text-muted-foreground text-xs mt-1">
                  A API de movimentações da PDA retornou vazio. O ritmo de consumo não pode ser calculado, então a sinaleira fica em "sem dados".
                  Verifique permissões da conta PDA ou contate o suporte para liberar o endpoint <code>CreditConsumeMovement</code>.
                </p>
              </div>
            </CardContent>
          </Card>
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
                    <TableRow
                      key={base.baseId}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => openDrawer(base)}
                    >

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

        <Card ref={movementsRef}>
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

        <Sheet open={!!drawerBase} onOpenChange={(o) => !o && setDrawerBase(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
            {drawerBase && (
              <>
                <SheetHeader>
                  <SheetTitle>{drawerBase.baseName}</SheetTitle>
                  <SheetDescription>
                    {drawerBase.accountName} · Saldo {fmt(drawerBase.availableCredits)} créditos
                  </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-md border p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Meta/mês</p>
                    <p className="text-sm font-semibold">{drawerBase.monthlyTarget > 0 ? fmt(drawerBase.monthlyTarget) : "—"}</p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Consumo 30d</p>
                    <p className="text-sm font-semibold">{fmt(drawerBase.lastMonthConsumption)}</p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Ritmo</p>
                    <p className="text-sm font-semibold">
                      {drawerBase.consumptionRatio !== null ? `${Math.round(drawerBase.consumptionRatio * 100)}%` : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Movimentações detalhadas</h4>
                  <span className="text-xs text-muted-foreground">{drawerMovements.length} registro(s)</span>
                </div>

                <ScrollArea className="flex-1 -mx-6 px-6">
                  {drawerMovements.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-12">
                      Nenhuma movimentação para esta base.
                    </div>
                  ) : (
                    <div className="space-y-2 pb-6">
                      {drawerMovements.map((mov, i) => {
                        const isCredit = mov.amount >= 0;
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-md border p-3"
                          >
                            {isCredit ? (
                              <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <ArrowDownCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {mov.date ? new Date(mov.date).toLocaleString("pt-BR") : "—"}
                                </p>
                                <span className={`text-sm font-semibold ${isCredit ? "text-green-500" : "text-red-500"}`}>
                                  {isCredit ? "+" : ""}{fmt(mov.amount)}
                                </span>
                              </div>
                              <p className="text-sm font-medium mt-0.5">
                                {isCredit ? "Crédito" : "Débito"}
                                {mov.type ? ` · ${mov.type}` : ""}
                              </p>
                              {mov.reason && (
                                <p className="text-xs text-muted-foreground mt-1 break-words">{mov.reason}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

    </TooltipProvider>
  );
}
