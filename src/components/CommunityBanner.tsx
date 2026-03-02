import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Users2, ArrowRight, X, Sparkles } from 'lucide-react';

export function CommunityBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkCommunityVisibility = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('community_visible')
        .eq('user_id', user.id)
        .single();
      if (data && !data.community_visible) {
        const dismissedKey = `community_banner_dismissed_${user.id}`;
        const wasDismissed = sessionStorage.getItem(dismissedKey);
        if (!wasDismissed) {
          setVisible(true);
        }
      }
    };
    checkCommunityVisibility();
  }, [user]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    if (user) {
      sessionStorage.setItem(`community_banner_dismissed_${user.id}`, 'true');
    }
  };

  const handleActivate = async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ community_visible: true })
      .eq('user_id', user.id);
    setVisible(false);
    navigate('/community');
  };

  if (!visible || dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 backdrop-blur-xl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-lg shrink-0">
          <Users2 className="w-7 h-7 text-primary-foreground" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Participe da Comunidade</h3>
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Novo
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Conecte-se com outros profissionais de RH, compartilhe experiências com o PDA e troque insights no nosso feed exclusivo. Ative sua presença e comece a interagir!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleActivate}
            className="gap-2 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
          >
            Ativar e Explorar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
