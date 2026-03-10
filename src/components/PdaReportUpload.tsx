import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface Props {
  programId: string;
  programName?: string;
}

export function PdaReportUpload({ programId, programName }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['pda-report', user?.id, programId],
    enabled: !!user?.id && !!programId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('pda_reports')
        .select('*')
        .eq('user_id', user!.id)
        .eq('program_id', programId)
        .maybeSingle();
      return data;
    },
  });

  const handleUpload = async (file: File) => {
    if (!user || !file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 20MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `pda-reports/${user.id}/${programId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('program-materials')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao fazer upload do arquivo');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('program-materials').getPublicUrl(path);

    if (report) {
      await (supabase as any)
        .from('pda_reports')
        .update({
          file_url: urlData.publicUrl,
          file_name: file.name,
          uploaded_at: new Date().toISOString(),
        })
        .eq('id', report.id);
    } else {
      await (supabase as any)
        .from('pda_reports')
        .insert({
          user_id: user.id,
          program_id: programId,
          file_url: urlData.publicUrl,
          file_name: file.name,
        });
    }

    queryClient.invalidateQueries({ queryKey: ['pda-report', user.id, programId] });
    toast.success('Relatório PDA enviado com sucesso!');
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!report || !user) return;
    setUploading(true);
    await (supabase as any).from('pda_reports').delete().eq('id', report.id);
    queryClient.invalidateQueries({ queryKey: ['pda-report', user.id, programId] });
    toast.success('Relatório removido');
    setUploading(false);
  };

  if (isLoading) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>

          {report ? (
            <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Meu Relatório PDA</p>
                <p className="text-xs text-muted-foreground truncate">{report.file_name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" asChild className="gap-1.5">
                  <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir
                  </a>
                </Button>
                <label className="cursor-pointer">
                  <Button size="sm" variant="ghost" className="gap-1.5" asChild>
                    <span>
                      <Upload className="w-3.5 h-3.5" /> Substituir
                    </span>
                  </Button>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                    disabled={uploading}
                  />
                </label>
                <Button size="sm" variant="ghost" onClick={handleDelete} disabled={uploading} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Relatório PDA</p>
                <p className="text-xs text-muted-foreground">Faça upload do seu relatório PDA para consulta rápida</p>
              </div>
              <label className="cursor-pointer shrink-0">
                <Button size="sm" className="gap-1.5" asChild disabled={uploading}>
                  <span>
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Enviar PDF
                  </span>
                </Button>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
