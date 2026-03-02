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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react';

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
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Entrada
          </Button>
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

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma entrada encontrada</TableCell>
                </TableRow>
              ) : (
                filtered.map(entry => (
                  <TableRow key={entry.id}>
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
    </AppLayout>
  );
};

export default AdminKnowledgeBase;
