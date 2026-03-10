import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, FileText, Video, ExternalLink, FileUp, Download } from 'lucide-react';

const FILE_TYPES = [
  { value: 'link', label: 'Link' },
  { value: 'video', label: 'Vídeo' },
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'Documento' },
  { value: 'other', label: 'Outro' },
];

const CATEGORIES = [
  { value: 'prework', label: 'Pre-work' },
  { value: 'material', label: 'Material' },
  { value: 'exercise', label: 'Exercício' },
];

interface Props {
  moduleId: string;
  programId: string;
  moduleTitle: string;
}

export function ModuleMaterialManager({ moduleId, programId, moduleTitle }: Props) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('link');
  const [fileUrl, setFileUrl] = useState('');
  const [category, setCategory] = useState('material');
  const [file, setFile] = useState<File | null>(null);

  const { data: materials = [], refetch } = useQuery({
    queryKey: ['module-materials-admin', moduleId],
    queryFn: async () => {
      const { data } = await supabase
        .from('program_materials')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_number');
      return data || [];
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFileType('link');
    setFileUrl('');
    setCategory('material');
    setFile(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    setSaving(true);
    try {
      let url = fileUrl.trim();

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${programId}/${moduleId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('program-materials')
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('program-materials')
          .getPublicUrl(fileName);
        url = publicUrl;
      }

      const { error } = await supabase.from('program_materials').insert({
        program_id: programId,
        module_id: moduleId,
        title: title.trim(),
        description: description.trim() || null,
        file_url: url || null,
        file_type: fileType,
        category,
        order_number: materials.length,
      });
      if (error) throw error;
      toast.success('Material adicionado ao módulo');
      setDialogOpen(false);
      resetForm();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['program-materials-admin'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('program_materials').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover material');
    } else {
      toast.success('Material removido');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['program-materials-admin'] });
    }
  };

  const getIcon = (ft: string | null) => {
    if (ft === 'video') return <Video className="w-4 h-4" />;
    if (ft === 'pdf') return <FileText className="w-4 h-4" />;
    if (ft === 'link') return <ExternalLink className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Materiais & Vídeos
          {materials.length > 0 && (
            <Badge variant="secondary" className="text-xs">{materials.length}</Badge>
          )}
        </h4>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>

      {materials.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground">{getIcon(m.file_type)}</TableCell>
                <TableCell className="font-medium text-sm">{m.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {CATEGORIES.find(c => c.value === m.category)?.label || m.category || 'Material'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {FILE_TYPES.find(f => f.value === m.file_type)?.label || m.file_type || '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {m.file_url && (
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Material — {moduleTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Vídeo introdutório" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {fileType === 'link' || fileType === 'video' ? (
              <div className="space-y-2">
                <Label>{fileType === 'video' ? 'URL do Vídeo' : 'URL'}</Label>
                <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder={fileType === 'video' ? 'https://youtube.com/watch?v=...' : 'https://...'} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Upload de arquivo</Label>
                  <Input type="file" accept={fileType === 'pdf' ? '.pdf' : '*'} onChange={e => setFile(e.target.files?.[0] || null)} />
                  {file && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileUp className="w-3 h-3" /> {file.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Ou URL externa</Label>
                  <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição..." className="min-h-[70px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
