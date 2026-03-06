import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Video, Calendar, User, ExternalLink, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  presenter: string | null;
  webinar_date: string | null;
  created_at: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return null;
}

const emptyForm = { title: '', description: '', video_url: '', thumbnail_url: '', presenter: '', webinar_date: '' };

export default function Webinars() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchWebinars();
  }, [user]);

  const fetchWebinars = async () => {
    try {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .order('webinar_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      setWebinars(data || []);
    } catch {
      toast.error('Erro ao carregar webinars');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (w: Webinar) => {
    setEditingId(w.id);
    setForm({
      title: w.title,
      description: w.description || '',
      video_url: w.video_url,
      thumbnail_url: w.thumbnail_url || '',
      presenter: w.presenter || '',
      webinar_date: w.webinar_date || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.video_url.trim()) {
      toast.error('Título e URL do vídeo são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        video_url: form.video_url.trim(),
        thumbnail_url: form.thumbnail_url.trim() || null,
        presenter: form.presenter.trim() || null,
        webinar_date: form.webinar_date || null,
        ...(editingId ? {} : { created_by: user?.id }),
      };
      if (editingId) {
        const { error } = await supabase.from('webinars').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Webinar atualizado');
      } else {
        const { error } = await supabase.from('webinars').insert(payload);
        if (error) throw error;
        toast.success('Webinar adicionado');
      }
      setDialogOpen(false);
      fetchWebinars();
    } catch {
      toast.error('Erro ao salvar webinar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este webinar?')) return;
    try {
      const { error } = await supabase.from('webinars').delete().eq('id', id);
      if (error) throw error;
      toast.success('Webinar excluído');
      fetchWebinars();
    } catch {
      toast.error('Erro ao excluir webinar');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Webinars</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Assista aos webinars gravados da Grou
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Webinar
            </Button>
          )}
        </div>

        {/* Empty state */}
        {webinars.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Video className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Nenhum webinar disponível</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {isAdmin ? 'Clique em "Adicionar Webinar" para começar.' : 'Em breve novos conteúdos estarão disponíveis.'}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {webinars.map((w) => {
            const thumb = w.thumbnail_url || getYouTubeThumbnail(w.video_url);
            const embedUrl = getYouTubeEmbedUrl(w.video_url);
            return (
              <Card
                key={w.id}
                className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Thumbnail / Player */}
                <div className="relative aspect-video bg-muted/30 overflow-hidden">
                  {playerUrl === w.id && embedUrl ? (
                    <iframe
                      src={`${embedUrl}?autoplay=1`}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={w.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <button
                        onClick={() => {
                          if (embedUrl) {
                            setPlayerUrl(w.id);
                          } else {
                            window.open(w.video_url, '_blank');
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                        </div>
                      </button>
                    </>
                  )}
                </div>

                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{w.title}</h3>
                  {w.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{w.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    {w.presenter && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {w.presenter}
                      </span>
                    )}
                    {w.webinar_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(w.webinar_date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(w)} className="gap-1 text-xs h-7">
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(w.id)} className="gap-1 text-xs h-7 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" /> Excluir
                      </Button>
                      <a href={w.video_url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Webinar' : 'Adicionar Webinar'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize as informações do webinar.' : 'Preencha as informações do webinar.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Webinar de Liderança" />
            </div>
            <div>
              <Label>URL do Vídeo *</Label>
              <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do conteúdo..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Apresentador</Label>
                <Input value={form.presenter} onChange={e => setForm(f => ({ ...f, presenter: e.target.value }))} placeholder="Nome" />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.webinar_date} onChange={e => setForm(f => ({ ...f, webinar_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>URL da Thumbnail (opcional)</Label>
              <Input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="Deixe vazio para usar thumbnail do YouTube" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Player Dialog */}
      {playerUrl && !getYouTubeEmbedUrl(webinars.find(w => w.id === playerUrl)?.video_url || '') && null}
    </AppLayout>
  );
}
