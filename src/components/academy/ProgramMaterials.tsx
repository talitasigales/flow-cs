import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, FileText, FileIcon, Video, Download, ClipboardList, FolderOpen, ChevronRight } from 'lucide-react';
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
  const isVideo = m.file_type === 'video';
  const videoUrls: { url: string; title: string | null }[] =
    isVideo && m.video_urls && Array.isArray(m.video_urls) && m.video_urls.length > 0
      ? m.video_urls
      : isVideo && m.file_url ? [{ url: m.file_url, title: null }] : [];

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
        <div className="mt-0.5 text-muted-foreground">{getFileIcon(m.file_type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {m.title}
            {videoUrls.length > 1 && (
              <Badge variant="secondary" className="ml-2 text-xs">{videoUrls.length} vídeos</Badge>
            )}
          </p>
          {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
        </div>
        {m.file_url && !isVideo && (
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <a href={m.file_url} target="_blank" rel="noopener noreferrer">
              {['pdf', 'doc', 'other'].includes(m.file_type) ? (
                <Download className="w-3.5 h-3.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
            </a>
          </Button>
        )}
      </div>
      {videoUrls.length > 0 && (
        <div className="space-y-3 pl-2">
          {videoUrls.map((vid: any, idx: number) => {
            const ytId = getYouTubeId(vid.url);
            if (!ytId) return null;
            return (
              <div key={idx} className="space-y-1">
                {vid.title && <p className="text-xs font-medium text-muted-foreground">{vid.title}</p>}
                <div className="rounded-lg overflow-hidden border aspect-video max-w-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={vid.title || m.title}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
