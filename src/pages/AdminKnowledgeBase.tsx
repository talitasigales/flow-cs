import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, BookOpen, Upload, FileText, Loader2, CheckSquare, Globe, Link } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'Fundamentos',
  'Modelos PDI',
  'Guia PDI',
  'Metodologias',
  'Plataforma',
  'Diferenciais',
  'Aplicação',
  'FAQ',
  'Importado',
];

const AdminKnowledgeBase = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // URL import state
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlCategory, setUrlCategory] = useState('Importado');
  const [importingUrl, setImportingUrl] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('category')
      .order('title');

    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } else {
      setEntries((data as KnowledgeEntry[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchEntries();
  }, [isAdmin]);

  const openAddDialog = () => {
    setEditingEntry(null);
    setFormTitle('');
    setFormCategory('');
    setFormCustomCategory('');
    setFormContent('');
    setFormKeywords('');
    setDialogOpen(true);
  };

  const openEditDialog = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    const isKnownCategory = CATEGORIES.includes(entry.category);
    setFormCategory(isKnownCategory ? entry.category : '__custom__');
    setFormCustomCategory(isKnownCategory ? '' : entry.category);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormKeywords(entry.keywords?.join(', ') || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const category = formCategory === '__custom__' ? formCustomCategory.trim() : formCategory;
    if (!formTitle.trim() || !category || !formContent.trim()) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const keywords = formKeywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const payload = {
      title: formTitle.trim(),
      category,
      content: formContent.trim(),
      keywords: keywords.length > 0 ? keywords : null,
    };

    if (editingEntry) {
      const { error } = await supabase
        .from('knowledge_base')
        .update(payload)
        .eq('id', editingEntry.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Entrada atualizada com sucesso' });
        setDialogOpen(false);
        fetchEntries();
      }
    } else {
      const { error } = await supabase
        .from('knowledge_base')
        .insert(payload);

      if (error) {
        toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Entrada criada com sucesso' });
        setDialogOpen(false);
        fetchEntries();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', deletingId);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Entrada excluída com sucesso' });
      fetchEntries();
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .in('id', ids);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${ids.length} entrada(s) excluída(s) com sucesso` });
      setSelectedIds(new Set());
      fetchEntries();
    }
    setBulkDeleting(false);
    setBulkDeleteDialogOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ['txt', 'md', 'csv', 'json', 'pdf', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExts.includes(ext)) {
      toast({ title: 'Formato não suportado', description: 'Use arquivos .txt, .md, .csv, .json, .pdf, .doc ou .docx', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O limite é 100MB', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${Date.now()}-${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke('parse-knowledge-file', {
        body: { filePath, fileName: file.name, category: 'Importado' }
      });

      if (error) {
        const errorMsg = (error as any)?.context?.body?.error || error.message;
        throw new Error(errorMsg);
      }

      if (data?.error) throw new Error(data.error);

      toast({ title: 'Arquivo importado com sucesso!', description: `${data.extractedLength} caracteres extraídos` });
      fetchEntries();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erro ao importar arquivo', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      toast({ title: 'Digite uma URL', variant: 'destructive' });
      return;
    }

    setImportingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-knowledge-url', {
        body: { url: urlInput.trim(), title: urlTitle.trim() || undefined, category: urlCategory }
      });

      if (error) {
        const errorMsg = (error as any)?.context?.body?.error || error.message;
        throw new Error(errorMsg);
      }

      if (data?.error) throw new Error(data.error);

      toast({ title: 'URL importada com sucesso!', description: `${data.extractedLength} caracteres extraídos em ${data.totalChunks} parte(s)` });
      setUrlDialogOpen(false);
      setUrlInput('');
      setUrlTitle('');
      setUrlCategory('Importado');
      fetchEntries();
    } catch (error: any) {
      console.error('URL import error:', error);
      toast({ title: 'Erro ao importar URL', description: error.message, variant: 'destructive' });
    } finally {
      setImportingUrl(false);
    }
  };

  const filtered = entries.filter(e => {
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase()) ||
      e.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchSearch && matchCategory;
  });

  if (adminLoading || !isAdmin) return null;

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
              <p className="text-sm text-muted-foreground">Gerencie o conteúdo que alimenta as respostas da Nanda</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="knowledge-file-upload"
              disabled={uploading}
            />
            <Button
              variant="outline"
              className="gap-2"
              disabled={uploading}
              onClick={() => document.getElementById('knowledge-file-upload')?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Importando...' : 'Importar Arquivo'}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setUrlDialogOpen(true)}
            >
              <Globe className="h-4 w-4" /> Importar URL
            </Button>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Entrada
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, conteúdo ou palavra-chave..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <span className="text-sm font-medium">{selectedIds.size} selecionada(s)</span>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Excluir selecionadas
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Limpar seleção
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Palavras-chave</TableHead>
                <TableHead className="hidden lg:table-cell">Prévia</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma entrada encontrada</TableCell>
                </TableRow>
              ) : (
                filtered.map(entry => (
                  <TableRow key={entry.id} className={selectedIds.has(entry.id) ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={() => toggleSelect(entry.id)}
                        aria-label={`Selecionar ${entry.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{entry.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {entry.keywords?.length ? (
                        <span className="text-xs text-muted-foreground">{entry.keywords.length} palavra(s)</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[300px] truncate text-sm text-muted-foreground">
                      {entry.content.slice(0, 100)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setDeletingId(entry.id); setDeleteDialogOpen(true); }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground text-right">{filtered.length} entrada(s)</p>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kb-title">Título *</Label>
              <Input id="kb-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-category">Categoria *</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Outra (digitar)</SelectItem>
                </SelectContent>
              </Select>
              {formCategory === '__custom__' && (
                <Input
                  placeholder="Digite a categoria"
                  value={formCustomCategory}
                  onChange={e => setFormCustomCategory(e.target.value)}
                  maxLength={100}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-content">Conteúdo *</Label>
              <Textarea
                id="kb-content"
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                rows={10}
                maxLength={50000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-keywords">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="kb-keywords"
                value={formKeywords}
                onChange={e => setFormKeywords(e.target.value)}
                placeholder="ex: pda, comportamento, liderança"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingEntry ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A entrada será removida permanentemente da base de conhecimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} entrada(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. As {selectedIds.size} entrada(s) selecionada(s) serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? 'Excluindo...' : `Excluir ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* URL Import Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Importar de URL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">URL do site *</Label>
              <Input
                id="url-input"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://exemplo.com/pagina"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url-title">Título (opcional)</Label>
              <Input
                id="url-title"
                value={urlTitle}
                onChange={e => setUrlTitle(e.target.value)}
                placeholder="Será extraído automaticamente do site se vazio"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url-category">Categoria</Label>
              <Select value={urlCategory} onValueChange={setUrlCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              O conteúdo textual da página será extraído e adicionado à base de conhecimento.
              Páginas com conteúdo dinâmico (JavaScript) podem não ser totalmente extraídas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialogOpen(false)} disabled={importingUrl}>Cancelar</Button>
            <Button onClick={handleUrlImport} disabled={importingUrl} className="gap-2">
              {importingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {importingUrl ? 'Importando...' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminKnowledgeBase;
