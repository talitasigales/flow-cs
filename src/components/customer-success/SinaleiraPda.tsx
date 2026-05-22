import { useSinaleiraPda, SinaleiraStatus } from "@/hooks/useSinaleiraPda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const STATUS_CONFIG: Record<SinaleiraStatus, { label: string; dot: string; badge: string }> = {
  ok:       { label: "Normal",   dot: "bg-green-500",  badge: "bg-green-500/15 text-green-500 border-green-500/30" },
  warning:  { label: "Atenção",  dot: "bg-yellow-400", badge: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  critical: { label: "Crítico",  dot: "bg-red-500",    badge: "bg-destructive/15 text-destructive border-destructive/30" },
  expired:  { label: "Expirado", dot: "bg-gray-400",   badge: "bg-muted text-muted-foreground border-border" },
};

export function SinaleiraPda() {
  const { loading, error, bases, movements, lastUpdated, refresh } = useSinaleiraPda();
  const [selectedBase, setSelectedBase] = useState("all");

  const summary = {
    total:    bases.length,
    ok:       bases.filter((b) => b.status === "ok").length,
    warning:  bases.filter((b) => b.status === "warning").length,
    critical: bases.filter((b) => b.status === "critical" || b.status === "expired").length,
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
    { status: "ok"       as const, value: summary.ok,       desc: "bases sem alerta" },
    { status: "warning"  as const, value: summary.warning,  desc: "bases próximas do limite" },
    { status: "critical" as const, value: summary.critical, desc: "bases que precisam de ação" },
  ];

  const sortedBases = [...bases].sort((a, b) => {
    const order: Record<SinaleiraStatus, number> = { expired: 0, critical: 1, warning: 2, ok: 3 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Sinaleira PDA</h2>
          <p className="text-sm text-muted-foreground">
            Saldo de créditos e expiração por base de clientes
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Base / Conta</TableHead>
                <TableHead>Créditos disponíveis</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Sinaleira</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma base encontrada.
                  </TableCell>
                </TableRow>
              ) : sortedBases.map((base) => {
                const cfg = STATUS_CONFIG[base.status];
                return (
                  <TableRow key={base.baseId}>
                    <TableCell>
                      <p className="font-medium">{base.baseName}</p>
                      <p className="text-xs text-muted-foreground">{base.accountName}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{base.availableCredits.toLocaleString("pt-BR")}</span>
                      <span className="text-muted-foreground"> / {base.totalCredits.toLocaleString("pt-BR")}</span>
                    </TableCell>
                    <TableCell className="w-[180px]">
                      <Progress value={base.usedPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{base.usedPercent}% consumido</p>
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
  );
}
