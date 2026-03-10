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
import { Plus, Trash2, FileText, Video, ExternalLink, FileUp, X } from 'lucide-react';

const FILE_TYPES = [
  { value: 'link', label: 'Link' },
  { value: 'video', label: 'Vídeo(s)' },
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'Documento' },
  { value: 'other', label: 'Outro' },
];

const CATEGORIES = [
  { value: 'prework', label: 'Pre-work' },
  { value: 'material', label: 'Material' },
  { value: 'exercise', label: 'Exercício' },
];

interface VideoEntry {
  url: string;
  title: string;
}

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
  const [videoEntries, setVideoEntries] = useState<VideoEntry[]>([{ url: '', title: '' }]);

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
    setVideoEntries([{ url: '', title: '' }]);
  };

  const addVideoEntry = () => {
    setVideoEntries(prev => [...prev, { url: '', title: '' }]);
  };

  const removeVideoEntry = (index: number) => {
    setVideoEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateVideoEntry = (index: number, field: 'url' | 'title', value: string) => {
    setVideoEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
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

      // For video type, use first video URL as file_url and store all in video_urls
      const validVideos = videoEntries.filter(v => v.url.trim());
      const insertData: any = {
        program_id: programId,
        module_id: moduleId,
        title: title.trim(),
        description: description.trim() || null,
        file_url: fileType === 'video' ? (validVideos[0]?.url || null) : (url || null),
        file_type: fileType,
        category,
        order_number: materials.length,
      };

      if (fileType === 'video' && validVideos.length > 0) {
        insertData.video_urls = validVideos.map(v => ({
          url: v.url.trim(),
          title: v.title.trim() || null,
        }));
      }

      const { error } = await supabase.from('program_materials').insert(insertData);
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

  const getVideoCount = (m: any) => {
    const urls = m.video_urls as VideoEntry[] | null;
    return urls?.length || (m.file_url && m.file_type === 'video' ? 1 : 0);
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
            {materials.map((m: any) => {
              const vCount = getVideoCount(m);
              return (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground">{getIcon(m.file_type)}</TableCell>
                  <TableCell className="font-medium text-sm">
                    {m.title}
                    {vCount > 1 && (
                      <Badge variant="outline" className="ml-2 text-xs">{vCount} vídeos</Badge>
                    )}
                  </TableCell>
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
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Material — {moduleTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Vídeos do Módulo 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={fileType} onValueChange={(v) => { setFileType(v); }}>
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

            {fileType === 'video' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>URLs dos Vídeos (YouTube)</Label>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={addVideoEntry}>
                    <Plus className="w-3 h-3" /> Adicionar vídeo
                  </Button>
                </div>
                <div className="space-y-3">
                  {videoEntries.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <Input
                          value={entry.url}
                          onChange={e => updateVideoEntry(idx, 'url', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="text-sm"
                        />
                        <Input
                          value={entry.title}
                          onChange={e => updateVideoEntry(idx, 'title', e.target.value)}
                          placeholder={`Título do vídeo ${idx + 1} (opcional)`}
                          className="text-xs h-8"
                        />
                      </div>
                      {videoEntries.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 mt-0.5 text-muted-foreground hover:text-destructive" onClick={() => removeVideoEntry(idx)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : fileType === 'link' ? (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
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
