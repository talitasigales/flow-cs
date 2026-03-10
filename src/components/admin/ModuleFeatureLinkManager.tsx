import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Link2 } from 'lucide-react';
import { PLATFORM_FEATURES } from '@/lib/platformFeatures';

interface Props {
  moduleId: string;
  moduleTitle: string;
}

export function ModuleFeatureLinkManager({ moduleId, moduleTitle }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [featureKey, setFeatureKey] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: links = [], refetch } = useQuery({
    queryKey: ['module-feature-links', moduleId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('module_feature_links')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_number');
      return data || [];
    },
  });

  const handleSave = async () => {
    if (!featureKey) {
      toast.error('Selecione uma funcionalidade');
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('module_feature_links')
        .insert({
          module_id: moduleId,
          feature_key: featureKey,
          label: label.trim() || null,
          description: description.trim() || null,
          order_number: links.length,
        });
      if (error) throw error;
      toast.success('Funcionalidade vinculada');
      setDialogOpen(false);
      setFeatureKey('');
      setLabel('');
      setDescription('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao vincular');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('module_feature_links').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover vínculo');
    } else {
      toast.success('Vínculo removido');
      refetch();
    }
  };

  const getFeatureInfo = (key: string) => PLATFORM_FEATURES.find(f => f.key === key);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Funcionalidades — {moduleTitle}</h4>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Link2 className="w-3.5 h-3.5" /> Vincular
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma funcionalidade vinculada.</p>
      ) : (
        <div className="space-y-2">
          {links.map((link: any) => {
            const feature = getFeatureInfo(link.feature_key);
            return (
              <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{link.label || feature?.label || link.feature_key}</p>
                    <p className="text-xs text-muted-foreground">{link.description || feature?.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Funcionalidade ao Módulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Funcionalidade</Label>
              <Select value={featureKey} onValueChange={setFeatureKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_FEATURES.map(f => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rótulo personalizado (opcional)</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Crie seu PDI aqui" />
            </div>
            <div className="space-y-2">
              <Label>Descrição personalizada (opcional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve orientação para o aluno..." />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Vincular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
