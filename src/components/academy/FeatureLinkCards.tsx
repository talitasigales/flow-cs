import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowRight, Link2 } from 'lucide-react';
import { PLATFORM_FEATURES } from '@/lib/platformFeatures';

interface Props {
  moduleId: string;
}

export function FeatureLinkCards({ moduleId }: Props) {
  const navigate = useNavigate();

  const { data: links = [] } = useQuery({
    queryKey: ['module-feature-links', moduleId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('module_feature_links')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_number');
      return data || [];
    },
  });

  if (links.length === 0) return null;

  return (
    <div className="space-y-3">
      <h5 className="text-sm font-semibold flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        Ferramentas da Plataforma
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link: any) => {
          const feature = PLATFORM_FEATURES.find(f => f.key === link.feature_key);
          const route = feature?.route || '/dashboard';
          const displayLabel = link.label || feature?.label || link.feature_key;
          const displayDesc = link.description || feature?.description;

          return (
            <div
              key={link.id}
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                supabase.rpc('log_user_action', {
                  _action: 'FEATURE_LINK_ACCESS',
                  _table_name: 'module_feature_links',
                  _record_id: link.id,
                  _new_data: { feature_key: link.feature_key, label: displayLabel },
                });
                navigate(route);
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{displayLabel}</p>
                {displayDesc && <p className="text-xs text-muted-foreground mt-0.5">{displayDesc}</p>}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
