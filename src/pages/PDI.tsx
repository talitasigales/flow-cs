import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Search, BookOpen, Target, TrendingUp, CheckCircle2, AlertCircle, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { PDA_AXES } from '@/data/pdiTemplates';
import { exportPDIs } from '@/utils/exportUtils';

interface PDI {
  id: string;
  employee_name: string;
  employee_role: string | null;
  pda_axis: string;
  status: string;
  current_step: number;
  overall_progress: number;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
}

export default function PDI() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pdis, setPdis] = useState<PDI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [axisFilter, setAxisFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchPDIs();
    }
  }, [user]);

  const fetchPDIs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('pdis')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPdis(data || []);
    } catch (error) {
      console.error('Erro ao carregar PDIs:', error);
      toast.error('Erro ao carregar PDIs');
    } finally {
      setLoading(false);
    }
  };

  const filteredPDIs = pdis.filter(pdi => {
    const matchesSearch = pdi.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pdi.status === statusFilter;
    const matchesAxis = axisFilter === 'all' || pdi.pda_axis === axisFilter;
    return matchesSearch && matchesStatus && matchesAxis;
  });

  const stats = {
    total: pdis.length,
    active: pdis.filter(p => ['devolutiva', 'construcao', 'acompanhamento'].includes(p.status)).length,
    completed: pdis.filter(p => p.status === 'completed').length,
    atRisk: pdis.filter(p => p.overall_progress < 30 && p.status !== 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'fechamento': return 'text-blue-600';
      case 'acompanhamento': return 'text-yellow-600';
      case 'construcao': return 'text-orange-600';
      case 'devolutiva': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      devolutiva: 'Devolutiva',
      construcao: 'Construção',
      acompanhamento: 'Acompanhamento',
      fechamento: 'Fechamento',
      completed: 'Concluído'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando PDIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Planos de Desenvolvimento Individual</h1>
                <p className="text-muted-foreground mt-1">Gerencie os PDIs baseados em eixos PDA</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const axisLabels = Object.fromEntries(
                    Object.entries(PDA_AXES).map(([key, val]) => [key, val.name])
                  );
                  exportPDIs(pdis.map(p => ({
                    employee_name: p.employee_name,
                    pda_axis: p.pda_axis,
                    status: p.status,
                    current_stage: p.current_step,
                    start_date: p.start_date,
                    target_date: p.target_date
                  })), axisLabels);
                  toast.success('Dados exportados com sucesso!');
                }}
                disabled={pdis.length === 0}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" onClick={() => navigate('/pdi/guide')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Guia de Condução
              </Button>
              <Button onClick={() => navigate('/pdi/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo PDI
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de PDIs</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Em Risco</p>
                    <p className="text-2xl font-bold">{stats.atRisk}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="devolutiva">Devolutiva</SelectItem>
              <SelectItem value="construcao">Construção</SelectItem>
              <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
              <SelectItem value="fechamento">Fechamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={axisFilter} onValueChange={setAxisFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Eixo PDA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eixos</SelectItem>
              {Object.keys(PDA_AXES).map(axis => (
                <SelectItem key={axis} value={axis}>{PDA_AXES[axis].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PDI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPDIs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum PDI encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {pdis.length === 0 
                  ? 'Comece criando seu primeiro PDI' 
                  : 'Tente ajustar os filtros de busca'}
              </p>
              {pdis.length === 0 && (
                <Button onClick={() => navigate('/pdi/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro PDI
                </Button>
              )}
            </div>
          ) : (
            filteredPDIs.map((pdi) => {
              const axisInfo = PDA_AXES[pdi.pda_axis];
              return (
                <Card 
                  key={pdi.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/pdi/${pdi.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{pdi.employee_name}</h3>
                        {pdi.employee_role && (
                          <p className="text-sm text-muted-foreground">{pdi.employee_role}</p>
                        )}
                      </div>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: axisInfo?.color }}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Eixo PDA:</span>
                        <span className="font-medium">{axisInfo?.name}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-medium ${getStatusColor(pdi.status)}`}>
                          {getStatusLabel(pdi.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Etapa:</span>
                        <span className="font-medium">{pdi.current_step}/5</span>
                      </div>

                      {pdi.target_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prazo:</span>
                          <span className="font-medium">
                            {new Date(pdi.target_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progresso:</span>
                          <span className="font-medium">{pdi.overall_progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${pdi.overall_progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
