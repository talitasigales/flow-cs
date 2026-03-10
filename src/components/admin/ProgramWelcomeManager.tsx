import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Video, Upload, Trash2 } from 'lucide-react';

interface Props {
  programId: string;
}

export function ProgramWelcomeManager({ programId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageType, setMessageType] = useState<'text' | 'video'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [active, setActive] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadWelcome();
  }, [programId]);

  const loadWelcome = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('program_welcome_messages')
      .select('*')
      .eq('program_id', programId)
      .maybeSingle();

    if (data) {
      setExistingId(data.id);
      setMessageType(data.message_type || 'text');
      setTitle(data.title || '');
      setContent(data.content || '');
      setVideoUrl(data.video_url || '');
      setActive(data.active ?? true);
    } else {
      setExistingId(null);
      setMessageType('text');
      setTitle('');
      setContent('');
      setVideoUrl('');
      setActive(true);
    }
    setLoading(false);
  };

  const handleVideoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 50MB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `welcome-videos/${programId}.${ext}`;
    const { error } = await supabase.storage.from('program-materials').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Erro ao fazer upload do vídeo');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('program-materials').getPublicUrl(path);
    setVideoUrl(urlData.publicUrl);
    setUploading(false);
    toast.success('Vídeo enviado com sucesso');
  };

  const handleSave = async () => {
    if (messageType === 'text' && !content.trim()) {
      toast.error('Preencha o conteúdo da mensagem');
      return;
    }
    if (messageType === 'video' && !videoUrl.trim()) {
      toast.error('Faça upload de um vídeo');
      return;
    }

    setSaving(true);
    const payload = {
      program_id: programId,
      message_type: messageType,
      title: title.trim() || null,
      content: messageType === 'text' ? content.trim() : null,
      video_url: messageType === 'video' ? videoUrl.trim() : null,
      active,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existingId) {
      ({ error } = await (supabase as any).from('program_welcome_messages').update(payload).eq('id', existingId));
    } else {
      ({ error } = await (supabase as any).from('program_welcome_messages').insert(payload));
    }

    if (error) {
      toast.error('Erro ao salvar mensagem de boas-vindas');
    } else {
      toast.success('Mensagem de boas-vindas salva');
      await loadWelcome();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!existingId) return;
    setSaving(true);
    await (supabase as any).from('program_welcome_messages').delete().eq('id', existingId);
    toast.success('Mensagem removida');
    setExistingId(null);
    setTitle('');
    setContent('');
    setVideoUrl('');
    setMessageType('text');
    setActive(true);
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Mensagem de Boas-vindas
        </CardTitle>
        <CardDescription>
          Configure um pop-up exibido ao aluno na primeira vez que acessar este programa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label className="text-sm">{active ? 'Ativo' : 'Inativo'}</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo da mensagem</Label>
          <Select value={messageType} onValueChange={(v: 'text' | 'video') => setMessageType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">
                <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Texto</span>
              </SelectItem>
              <SelectItem value="video">
                <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Vídeo</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Título (opcional)</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Bem-vindo ao programa!" />
        </div>

        {messageType === 'text' ? (
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Escreva a mensagem de boas-vindas..."
              rows={6}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Vídeo</Label>
            {videoUrl ? (
              <div className="space-y-2">
                <video src={videoUrl} controls className="w-full max-w-md rounded-lg border" />
                <Button variant="outline" size="sm" onClick={() => setVideoUrl('')}>
                  <Trash2 className="w-4 h-4 mr-1" /> Remover vídeo
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Faça upload de um vídeo (máx. 50MB)</p>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoUpload(file);
                  }}
                  disabled={uploading}
                  className="max-w-xs mx-auto"
                />
                {uploading && <Loader2 className="w-4 h-4 animate-spin mx-auto mt-2" />}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {existingId ? 'Atualizar' : 'Salvar'}
          </Button>
          {existingId && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 className="w-4 h-4 mr-1" /> Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
