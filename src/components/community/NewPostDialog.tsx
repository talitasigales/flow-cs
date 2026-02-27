import { useState, useRef, useCallback } from 'react';
import { ImagePlus, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MentionTextarea } from './MentionTextarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyMentions } from '@/utils/mentionUtils';

const CATEGORIES = [
  { value: 'dica', label: '💡 Dica' },
  { value: 'duvida', label: '❓ Dúvida' },
  { value: 'case', label: '📋 Case' },
  { value: 'reflexao', label: '💭 Reflexão' },
];

interface NewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export function NewPostDialog({ open, onOpenChange, onPostCreated }: NewPostDialogProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('reflexao');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageSelect(file);
        return;
      }
    }
  }, [handleImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const ext = imageFile.name.split('.').pop() || 'png';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('community-images').upload(path, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from('community-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;
    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      const { data: postData, error } = await (supabase as any).from('community_posts').insert({
        user_id: user.id,
        content: content.trim(),
        category,
        is_anonymous: isAnonymous,
        image_url: imageUrl,
      }).select('id').single();
      if (error) throw error;
      // Notify mentioned users
      if (postData?.id && !isAnonymous) {
        await notifyMentions(content, user.id, postData.id);
      }
      toast.success('Publicação criada!');
      setContent('');
      setCategory('reflexao');
      setIsAnonymous(false);
      removeImage();
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      toast.error('Erro ao criar publicação');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Publicação</DialogTitle>
          <DialogDescription>Compartilhe com a comunidade</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className="space-y-2"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <Label>Conteúdo</Label>
            <MentionTextarea
              placeholder="Compartilhe sua experiência... Use @nome para mencionar alguém"
              value={content}
              onChange={setContent}
              onPaste={handlePaste}
              rows={5}
            />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Image upload button */}
          {!imagePreview && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Adicionar imagem
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleImageSelect(file);
              e.target.value = '';
            }}
          />

          <div className="flex items-center gap-2">
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label className="cursor-pointer">Publicar anonimamente</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
