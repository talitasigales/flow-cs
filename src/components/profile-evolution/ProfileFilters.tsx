import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface ProfileFiltersProps {
  uniqueNames: string[];
  uniqueYears: number[];
  selectedName: string;
  selectedYears: number[];
  filteredCount: number;
  totalCount: number;
  onNameChange: (name: string) => void;
  onYearToggle: (year: number) => void;
  onClearFilters: () => void;
}

export function ProfileFilters({
  uniqueNames,
  uniqueYears,
  selectedName,
  selectedYears,
  filteredCount,
  totalCount,
  onNameChange,
  onYearToggle,
  onClearFilters,
}: ProfileFiltersProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtros de Comparação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Name Filter */}
          <div className="space-y-2">
            <Label>Colaborador</Label>
            <Select value={selectedName} onValueChange={onNameChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os colaboradores</SelectItem>
                {uniqueNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Years Filter */}
          <div className="space-y-2">
            <Label>Anos para Comparar</Label>
            <div className="flex flex-wrap gap-2">
              {uniqueYears.map((year) => (
                <Badge
                  key={year}
                  variant={selectedYears.includes(year) ? 'default' : 'outline'}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onYearToggle(year)}
                >
                  {year}
                  {selectedYears.includes(year) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
              {uniqueYears.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhum ano disponível</span>
              )}
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedName !== 'all' || selectedYears.length > 0) && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Exibindo {filteredCount} de {totalCount} perfis
        </div>
      </CardContent>
    </Card>
  );
}
