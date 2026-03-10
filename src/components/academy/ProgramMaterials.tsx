import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, FileText, FileIcon, Video, Download, ClipboardList, FolderOpen, ChevronRight, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const CATEGORY_LABELS: Record<string, { label: string; icon: any }> = {
  prework: { label: 'Pre-work', icon: ClipboardList },
  material: { label: 'Materiais Adicionais', icon: FolderOpen },
  exercise: { label: 'Exercícios', icon: FileText },
};

function getFileIcon(fileType: string | null) {
  if (fileType === 'link') return <ExternalLink className="w-4 h-4" />;
  if (fileType === 'pdf') return <FileText className="w-4 h-4" />;
  if (fileType === 'video') return <Video className="w-4 h-4" />;
  return <FileIcon className="w-4 h-4" />;
}

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function MaterialItem({ m }: { m: any }) {
  const [open, setOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ ytId: string; title: string } | null>(null);
  const isVideo = m.file_type === 'video';
  const videoUrls: { url: string; title: string | null }[] =
    isVideo && m.video_urls && Array.isArray(m.video_urls) && m.video_urls.length > 0
      ? m.video_urls
      : isVideo && m.file_url ? [{ url: m.file_url, title: null }] : [];

  const hasExpandableContent = videoUrls.length > 0;
  const isLink = !isVideo && m.file_url;

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border bg-muted/20 overflow-hidden">
          <CollapsibleTrigger className="w-full" disabled={!hasExpandableContent}>
            <div className={cn(
              "flex items-center gap-3 p-3 transition-colors text-left",
              hasExpandableContent && "hover:bg-muted/40 cursor-pointer",
            )}>
              <div className="text-muted-foreground">{getFileIcon(m.file_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{m.title}</p>
                {m.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {videoUrls.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{videoUrls.length} {videoUrls.length === 1 ? 'vídeo' : 'vídeos'}</Badge>
                )}
                {isLink && (
                  <Button variant="ghost" size="sm" asChild className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                      {['pdf', 'doc', 'other'].includes(m.file_type) ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    </a>
                  </Button>
                )}
                {hasExpandableContent && (
                  <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-90")} />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          {hasExpandableContent && (
            <CollapsibleContent>
              <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
                {videoUrls.map((vid: any, idx: number) => {
                  const ytId = getYouTubeId(vid.url);
                  if (!ytId) return null;
                  const thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveVideo({ ytId, title: vid.title || m.title })}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors text-left group"
                    >
                      <div className="relative flex-shrink-0 w-28 aspect-video rounded-md overflow-hidden border">
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{vid.title || `Vídeo ${idx + 1}`}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>

      {/* Fullscreen video dialog */}
      <Dialog open={!!activeVideo} onOpenChange={(v) => !v && setActiveVideo(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black border-none gap-0">
          <div className="flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm">
            <p className="text-sm font-medium truncate">{activeVideo?.title}</p>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setActiveVideo(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {activeVideo && (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.ytId}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={activeVideo.title}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ProgramMaterialsProps {
  materials: any[];
  title?: string;
}

export function ProgramMaterials({ materials, title }: ProgramMaterialsProps) {
  const categories = ['prework', 'material', 'exercise'];
  const grouped = categories
    .map(cat => ({ cat, items: materials.filter(m => (m.category || 'material') === cat) }))
    .filter(g => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          {title}
        </h4>
      )}
      {grouped.map(({ cat, items }) => {
        const config = CATEGORY_LABELS[cat] || CATEGORY_LABELS.material;
        const Icon = config.icon;
        const isPrework = cat === 'prework';
        return (
          <div key={cat} className={cn(
            "space-y-2",
            isPrework && "bg-accent/10 border border-accent/30 rounded-lg p-4"
          )}>
            <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Icon className="w-3.5 h-3.5 text-primary" />
              {config.label}
              {isPrework && <Badge variant="secondary" className="text-[10px]">Antes do início</Badge>}
            </h5>
            <div className="space-y-2">
              {items.map((m: any) => <MaterialItem key={m.id} m={m} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
