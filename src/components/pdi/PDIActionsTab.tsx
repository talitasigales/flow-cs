import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle2, Circle, Clock, Edit, Trash2 } from 'lucide-react';
import PDIActionDialog from './PDIActionDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PDIActionsTabProps {
  pdiId: string;
  actions: any[];
  onRefresh: () => void;
}

const LEARNING_TYPES = {
  experience: { label: '🟢 Experiência', color: 'bg-green-500' },
  mentoring: { label: '🟡 Mentoria', color: 'bg-yellow-500' },
  formal: { label: '🔵 Formal', color: 'bg-blue-500' }
};

const STATUS_CONFIG = {
  pending: { label: 'Pendente', icon: Circle, color: 'text-muted-foreground' },
  in_progress: { label: 'Em Andamento', icon: Clock, color: 'text-yellow-500' },
  completed: { label: 'Concluída', icon: CheckCircle2, color: 'text-green-500' },
  cancelled: { label: 'Cancelada', icon: Circle, color: 'text-red-500' }
};

export default function PDIActionsTab({ pdiId, actions, onRefresh }: PDIActionsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);

  const handleEdit = (action: any) => {
    setSelectedAction(action);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedAction(null);
    setDialogOpen(true);
  };

  const handleStatusChange = async (actionId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pdi_actions')
        .update(updateData)
        .eq('id', actionId);

      if (error) throw error;
      toast.success('Status atualizado!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async () => {
    if (!actionToDelete) return;

    try {
      const { error } = await supabase
        .from('pdi_actions')
        .delete()
        .eq('id', actionToDelete);

      if (error) throw error;
      toast.success('Ação excluída!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir ação:', error);
      toast.error('Erro ao excluir ação');
    } finally {
      setDeleteDialogOpen(false);
      setActionToDelete(null);
    }
  };

  const confirmDelete = (actionId: string) => {
    setActionToDelete(actionId);
    setDeleteDialogOpen(true);
  };

  const groupedByStatus = {
    pending: actions.filter(a => a.status === 'pending'),
    in_progress: actions.filter(a => a.status === 'in_progress'),
    completed: actions.filter(a => a.status === 'completed')
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ações de Desenvolvimento</h3>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas ({actions.length})</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="experience">Experiência</TabsTrigger>
          <TabsTrigger value="mentoring">Mentoria</TabsTrigger>
          <TabsTrigger value="formal">Formal</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {actions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma ação cadastrada ainda. Clique em "Nova Ação" para começar.
              </CardContent>
            </Card>
          ) : (
            actions.map(action => (
              <ActionCard
                key={action.id}
                action={action}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
                onDelete={confirmDelete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(groupedByStatus).map(([status, items]) => (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label} ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map(action => (
                    <Card key={action.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{action.title}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {LEARNING_TYPES[action.learning_type as keyof typeof LEARNING_TYPES].label}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(action)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(action.id, 
                                status === 'pending' ? 'in_progress' : 'completed'
                              )}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['experience', 'mentoring', 'formal'].map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            {actions.filter(a => a.learning_type === type).map(action => (
              <ActionCard
                key={action.id}
                action={action}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
                onDelete={confirmDelete}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <PDIActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pdiId={pdiId}
        action={selectedAction}
        onSuccess={onRefresh}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionCard({ action, onEdit, onStatusChange, onDelete }: any) {
  const StatusIcon = STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG].icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-5 w-5 mt-0.5 ${STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG].color}`} />
              <div className="flex-1">
                <h4 className="font-semibold">{action.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {LEARNING_TYPES[action.learning_type as keyof typeof LEARNING_TYPES].label}
              </Badge>
              <Badge variant="outline">
                {STATUS_CONFIG[action.status as keyof typeof STATUS_CONFIG].label}
              </Badge>
              {action.due_date && (
                <Badge variant="outline">
                  Prazo: {new Date(action.due_date).toLocaleDateString('pt-BR')}
                </Badge>
              )}
            </div>

            {action.what_to_do && (
              <div className="text-sm">
                <span className="font-medium">O quê: </span>
                <span className="text-muted-foreground">{action.what_to_do}</span>
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(action)}>
              <Edit className="h-4 w-4" />
            </Button>
            {action.status === 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStatusChange(action.id, 'in_progress')}
                title="Iniciar"
              >
                <Clock className="h-4 w-4" />
              </Button>
            )}
            {action.status === 'in_progress' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStatusChange(action.id, 'completed')}
                title="Concluir"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(action.id)}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
