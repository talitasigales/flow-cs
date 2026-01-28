import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, TrendingUp, FileText, Calendar, BarChart, Filter, X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { AIAnalysis } from '@/components/AIAnalysis';
import {
  useProfileEvolution,
  ProfileFormDialog,
  ProfileFilters,
  ProfileCard,
  getProfileValue,
  getDimensionLabel,
  getProfileColorHex,
  calculateDelta,
} from '@/components/profile-evolution';

export default function ProfileEvolution() {
  const navigate = useNavigate();
  const {
    profiles,
    filteredProfiles,
    loading,
    authLoading,
    dialogOpen,
    selectedName,
    selectedYears,
    selectedYearA,
    selectedYearB,
    uniqueNames,
    uniqueYears,
    userId,
    setDialogOpen,
    setSelectedName,
    setSelectedYearA,
    setSelectedYearB,
    toggleYear,
    clearFilters,
    handleDelete,
    fetchProfiles,
  } = useProfileEvolution();

  // Prepare radar chart data
  const getRadarData = () => {
    if (!selectedYearA && !selectedYearB) return [];

    const dimensions = ['r', 'e', 'p', 'n', 'a'];

    return dimensions.map((dim) => {
      const profileA = profiles.find((p) => p.year === selectedYearA);
      const profileB = profiles.find((p) => p.year === selectedYearB);

      return {
        dimension: getDimensionLabel(dim),
        [selectedYearA || 'A']: profileA ? getProfileValue(profileA, dim) : 0,
        [selectedYearB || 'B']: profileB ? getProfileValue(profileB, dim) : 0,
      };
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold gradient-text">Evolução de Perfil PDA</h1>
            </div>
            <ProfileFormDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              existingYears={uniqueYears}
              onSuccess={fetchProfiles}
              userId={userId}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {profiles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum perfil registrado</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Comece adicionando seu perfil PDA para acompanhar sua evolução ao longo dos anos
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Perfil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="timeline" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="timeline">
                <Calendar className="mr-2 h-4 w-4" />
                Linha do Tempo
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <BarChart className="mr-2 h-4 w-4" />
                Comparação
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <TrendingUp className="mr-2 h-4 w-4" />
                Análise
              </TabsTrigger>
            </TabsList>

            {/* Timeline View */}
            <TabsContent value="timeline" className="space-y-6">
              <ProfileFilters
                uniqueNames={uniqueNames}
                uniqueYears={uniqueYears}
                selectedName={selectedName}
                selectedYears={selectedYears}
                filteredCount={filteredProfiles.length}
                totalCount={profiles.length}
                onNameChange={setSelectedName}
                onYearToggle={toggleYear}
                onClearFilters={clearFilters}
              />

              {filteredProfiles.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Filter className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum perfil encontrado</h3>
                    <p className="text-muted-foreground mb-6">Ajuste os filtros ou adicione novos perfis</p>
                    <Button onClick={clearFilters} variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredProfiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} onDelete={handleDelete} onRefresh={fetchProfiles} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Comparison View */}
            <TabsContent value="comparison" className="space-y-4">
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Comparação Entre Anos</CardTitle>
                  <CardDescription>Compare dois anos específicos e visualize as diferenças</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Year Selectors */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium">Comparar:</span>
                    <Select value={selectedYearA?.toString() || ''} onValueChange={(value) => setSelectedYearA(parseInt(value))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ano base" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-medium">vs</span>
                    <Select value={selectedYearB?.toString() || ''} onValueChange={(value) => setSelectedYearB(parseInt(value))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ano comparação" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedYearA && selectedYearB && (
                    <>
                      {/* Radar Chart */}
                      <div className="bg-muted/20 rounded-lg p-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Gráfico Comparativo REPNA
                        </h4>
                        <ResponsiveContainer width="100%" height={400}>
                          <RadarChart data={getRadarData()}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="dimension" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar
                              name={selectedYearA.toString()}
                              dataKey={selectedYearA.toString()}
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                            <Radar
                              name={selectedYearB.toString()}
                              dataKey={selectedYearB.toString()}
                              stroke="#22c55e"
                              fill="#22c55e"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-primary" />
                            <span className="text-sm font-medium">{selectedYearA}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#22c55e]" />
                            <span className="text-sm font-medium">{selectedYearB}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delta Cards - REPNA */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Diferenças - Perfil REPNA
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {['r', 'e', 'p', 'n', 'a'].map((dim) => {
                            const profileA = profiles.find((p) => p.year === selectedYearA);
                            const profileB = profiles.find((p) => p.year === selectedYearB);
                            const valueA = profileA?.analysis_result?.[dim as keyof typeof profileA.analysis_result] || 0;
                            const valueB = profileB?.analysis_result?.[dim as keyof typeof profileB.analysis_result] || 0;
                            const delta = calculateDelta(profiles, selectedYearA, selectedYearB, dim);

                            return (
                              <Card key={dim} className="p-4 border-border/50">
                                <div className="text-center space-y-2">
                                  <div className="text-2xl font-bold" style={{ color: getProfileColorHex(dim) }}>
                                    {dim.toUpperCase()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {valueA} → {valueB}
                                  </div>
                                  <div
                                    className={`flex items-center justify-center gap-1 text-sm font-semibold ${
                                      delta.trend === 'up'
                                        ? 'text-green-500'
                                        : delta.trend === 'down'
                                        ? 'text-red-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {delta.trend === 'up' && <ArrowUp className="h-4 w-4" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-4 w-4" />}
                                    {delta.trend === 'neutral' && <Minus className="h-4 w-4" />}
                                    {delta.value > 0 ? '+' : ''}
                                    {delta.value}
                                  </div>
                                  {delta.percentage !== 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      ({delta.percentage > 0 ? '+' : ''}
                                      {delta.percentage}%)
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delta Cards - Indicadores */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Diferenças - Indicadores Complementares
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {['tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map((dim) => {
                            const profileA = profiles.find((p) => p.year === selectedYearA);
                            const profileB = profiles.find((p) => p.year === selectedYearB);
                            const valueA = profileA?.analysis_result?.[dim as keyof typeof profileA.analysis_result] || 0;
                            const valueB = profileB?.analysis_result?.[dim as keyof typeof profileB.analysis_result] || 0;
                            const delta = calculateDelta(profiles, selectedYearA, selectedYearB, dim);

                            return (
                              <Card key={dim} className="p-4 border-border/50">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium line-clamp-2">{getDimensionLabel(dim)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {valueA} → {valueB}
                                  </div>
                                  <div
                                    className={`flex items-center gap-1 text-sm font-semibold ${
                                      delta.trend === 'up'
                                        ? 'text-green-500'
                                        : delta.trend === 'down'
                                        ? 'text-red-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {delta.trend === 'up' && <ArrowUp className="h-4 w-4" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-4 w-4" />}
                                    {delta.trend === 'neutral' && <Minus className="h-4 w-4" />}
                                    {delta.value > 0 ? '+' : ''}
                                    {delta.value}
                                    {delta.percentage !== 0 && (
                                      <span className="text-xs">
                                        ({delta.percentage > 0 ? '+' : ''}
                                        {delta.percentage}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis View */}
            <TabsContent value="analysis" className="space-y-6">
              {/* Year Selectors for Analysis */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Selecione os Anos para Análise</CardTitle>
                  <CardDescription>Compare dois anos para gerar insights detalhados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium">Analisar evolução de:</span>
                    <Select value={selectedYearA?.toString() || ''} onValueChange={(value) => setSelectedYearA(parseInt(value))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ano inicial" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-medium">para</span>
                    <Select value={selectedYearB?.toString() || ''} onValueChange={(value) => setSelectedYearB(parseInt(value))}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ano final" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {selectedYearA && selectedYearB && (
                <>
                  {/* AI Analysis */}
                  <Card className="gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Análise de IA
                      </CardTitle>
                      <CardDescription>Análise profissional gerada pela Nanda usando a base de conhecimento PDA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AIAnalysis
                        profileA={profiles.find((p) => p.year === selectedYearA)}
                        profileB={profiles.find((p) => p.year === selectedYearB)}
                      />
                    </CardContent>
                  </Card>

                  {/* REPNA Dimension Cards */}
                  <Card className="gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Dimensões REPNA
                      </CardTitle>
                      <CardDescription>
                        Mudanças no perfil comportamental entre {selectedYearA} e {selectedYearB}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { key: 'r', name: 'Risco', color: 'orange-500', desc: 'Gestão de incertezas e tomada de decisão sob pressão.' },
                          { key: 'e', name: 'Extroversão', color: 'yellow-500', desc: 'Estratégia relacional e comunicacional.' },
                          { key: 'p', name: 'Paciência', color: 'blue-500', desc: 'Ritmo de trabalho e gestão do tempo.' },
                          { key: 'n', name: 'Normas', color: 'green-500', desc: 'Relação com estruturas e processos.' },
                          { key: 'a', name: 'Autocontrole', color: 'purple-600', desc: 'Gestão emocional e autorregulação.' },
                        ].map(({ key, name, color, desc }) => {
                          const delta = calculateDelta(profiles, selectedYearA, selectedYearB, key);
                          const profileA = profiles.find((p) => p.year === selectedYearA);
                          const profileB = profiles.find((p) => p.year === selectedYearB);
                          const valueA = profileA?.analysis_result?.[key as keyof typeof profileA.analysis_result] || 0;
                          const valueB = profileB?.analysis_result?.[key as keyof typeof profileB.analysis_result] || 0;

                          return (
                            <Card key={key} className={`border-${color}/30 bg-${color}/5`}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-full bg-${color} flex items-center justify-center`}>
                                    <span className="text-white font-bold text-xl">{key.toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">{name}</CardTitle>
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="text-muted-foreground">
                                        {valueA} → {valueB}
                                      </span>
                                      <span
                                        className={`flex items-center font-semibold ${
                                          delta.trend === 'up'
                                            ? 'text-green-500'
                                            : delta.trend === 'down'
                                            ? 'text-red-500'
                                            : 'text-muted-foreground'
                                        }`}
                                      >
                                        {delta.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                        {delta.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                        {delta.trend === 'neutral' && <Minus className="h-3 w-3" />}
                                        {delta.value > 0 ? '+' : ''}
                                        {delta.value}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pb-4">
                                <p className="text-sm text-muted-foreground">{desc}</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Indicadores Complementares */}
                  <Card className="gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Indicadores Complementares
                      </CardTitle>
                      <CardDescription>
                        Mudanças nas métricas adicionais entre {selectedYearA} e {selectedYearB}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'tomada_decisoes', desc: 'Capacidade de avaliar cenários e escolher estratégias adequadas' },
                          { key: 'intensidade_perfil', desc: 'Grau de expressão e consistência comportamental' },
                          { key: 'energia', desc: 'Nível de energia e disposição para atividades' },
                          { key: 'equilibrio_energia', desc: 'Distribuição balanceada de energia entre atividades' },
                          { key: 'modificacao_perfil', desc: 'Grau de ajuste consciente do comportamento às demandas' },
                        ].map(({ key, desc }) => {
                          const delta = calculateDelta(profiles, selectedYearA, selectedYearB, key);
                          const profileA = profiles.find((p) => p.year === selectedYearA);
                          const profileB = profiles.find((p) => p.year === selectedYearB);
                          const valueA = profileA?.analysis_result?.[key as keyof typeof profileA.analysis_result] || 0;
                          const valueB = profileB?.analysis_result?.[key as keyof typeof profileB.analysis_result] || 0;

                          return (
                            <div key={key} className="space-y-3 p-4 rounded-lg bg-muted/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{getDimensionLabel(key)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {valueA} → {valueB}
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 text-lg font-bold ${
                                      delta.trend === 'up'
                                        ? 'text-green-500'
                                        : delta.trend === 'down'
                                        ? 'text-red-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {delta.trend === 'up' && <ArrowUp className="h-4 w-4" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-4 w-4" />}
                                    {delta.trend === 'neutral' && <Minus className="h-4 w-4" />}
                                    {delta.value > 0 ? '+' : ''}
                                    {delta.value}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Historical Data Table */}
                  <Card className="gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Dados Históricos
                      </CardTitle>
                      <CardDescription>Visão consolidada dos indicadores por ano</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-2 font-semibold">Ano</th>
                              <th className="text-center py-3 px-2 font-semibold text-orange-500">R</th>
                              <th className="text-center py-3 px-2 font-semibold text-yellow-500">E</th>
                              <th className="text-center py-3 px-2 font-semibold text-blue-500">P</th>
                              <th className="text-center py-3 px-2 font-semibold text-green-500">N</th>
                              <th className="text-center py-3 px-2 font-semibold text-purple-600">A</th>
                              <th className="text-center py-3 px-2 font-semibold">Energia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profiles.map((profile) => (
                              <tr key={profile.id} className="border-b border-border/50 hover:bg-muted/20">
                                <td className="py-3 px-2 font-medium">{profile.year}</td>
                                <td className="text-center py-3 px-2">{getProfileValue(profile, 'r')}</td>
                                <td className="text-center py-3 px-2">{getProfileValue(profile, 'e')}</td>
                                <td className="text-center py-3 px-2">{getProfileValue(profile, 'p')}</td>
                                <td className="text-center py-3 px-2">{getProfileValue(profile, 'n')}</td>
                                <td className="text-center py-3 px-2">{getProfileValue(profile, 'a')}</td>
                                <td className="text-center py-3 px-2">{getProfileValue(profile, 'energia')}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
