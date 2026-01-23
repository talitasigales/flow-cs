import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Link as LinkIcon, Upload, Trash2, Download, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: 'file' | 'link' | 'pdf';
  url: string | null;
  file_path: string | null;
  file_size: number | null;
  created_at: string;
}

interface ModuleMaterialsProps {
  moduleId: string;
}

export function ModuleMaterials({ moduleId }: ModuleMaterialsProps) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link' as 'file' | 'link' | 'pdf',
    url: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchMaterials();
  }, [moduleId]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('module_materials')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials((data || []) as Material[]);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (formData.type === 'link' && !formData.url.trim()) {
      toast.error('URL é obrigatória para links');
      return;
    }

    if ((formData.type === 'file' || formData.type === 'pdf') && !formData.file) {
      toast.error('Arquivo é obrigatório');
      return;
    }

    setUploading(true);

    try {
      let filePath = null;
      let fileSize = null;
      let url = formData.url;

      // Upload file if type is file or pdf
      if ((formData.type === 'file' || formData.type === 'pdf') && formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${moduleId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('module-materials')
          .upload(fileName, formData.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('module-materials')
          .getPublicUrl(fileName);

        filePath = fileName;
        fileSize = formData.file.size;
        url = publicUrl;
      }

      const { error } = await (supabase as any)
        .from('module_materials')
        .insert({
          module_id: moduleId,
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          url: url,
          file_path: filePath,
          file_size: fileSize,
          uploaded_by: user?.id
        });

      if (error) throw error;

      toast.success('Material adicionado com sucesso');
      setDialogOpen(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Erro ao adicionar material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string, filePath: string | null) => {
    try {
      // Delete file from storage if exists
      if (filePath) {
        await supabase.storage
          .from('module-materials')
          .remove([filePath]);
      }

      const { error } = await (supabase as any)
        .from('module_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      toast.success('Material removido com sucesso');
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Erro ao remover material');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'link',
      url: '',
      file: null
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Biblioteca de Materiais</CardTitle>
            <CardDescription>
              Materiais de apoio e recursos adicionais para este módulo
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Material</DialogTitle>
                  <DialogDescription>
                    Adicione um novo recurso à biblioteca deste módulo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Guia de Implementação"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o conteúdo deste material..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'file' | 'link' | 'pdf') => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Link Externo</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="file">Arquivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.type === 'link' ? (
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="file">Arquivo</Label>
                      <Input
                        id="file"
                        type="file"
                        accept={formData.type === 'pdf' ? '.pdf' : '*'}
                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      />
                      {formData.file && (
                        <p className="text-sm text-muted-foreground">
                          {formData.file.name} ({formatFileSize(formData.file.size)})
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading}>
                    {uploading ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum material disponível ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1 text-primary">
                  {getIcon(material.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{material.title}</h4>
                  {material.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {material.description}
                    </p>
                  )}
                  {material.file_size && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(material.file_size)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {material.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={material.url} target="_blank" rel="noopener noreferrer">
                        {material.type === 'link' ? (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar
                          </>
                        )}
                      </a>
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(material.id, material.file_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
