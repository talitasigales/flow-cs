import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BussolaLayout } from '@/components/bussola/BussolaLayout';
import { JourneyTimeline, EncounterStatus } from '@/components/bussola/JourneyTimeline';
import { BUSSOLA_ENCOUNTERS } from '@/data/bussolaEncounters';
import { Compass, Loader2, Rocket, Target } from 'lucide-react';

export default function BussolaJourney() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: program } = useQuery({
    queryKey: ['bussola-program'],
    queryFn: async () => {
      const { data } = await supabase
        .from('programs')
        .select('id, name')
        .eq('slug', 'bussola')
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['bussola-sessions', user?.id, program?.id],
    queryFn: async () => {
      if (!user?.id || !program?.id) return [];
      const { data } = await supabase
        .from('bussola_sessions' as any)
        .select('*')
        .eq('young_user_id', user.id)
        .eq('program_id', program.id);
      return (data || []) as any[];
    },
    enabled: !!user?.id && !!program?.id,
  });

  const { data: workbooks = [] } = useQuery({
    queryKey: ['bussola-workbooks', user?.id, program?.id],
    queryFn: async () => {
      if (!user?.id || !program?.id) return [];
      const { data } = await supabase
        .from('bussola_workbooks' as any)
        .select('encounter_number, is_prework, data')
        .eq('user_id', user.id)
        .eq('program_id', program.id);
      return (data || []) as any[];
    },
    enabled: !!user?.id && !!program?.id,
  });

  if (authLoading || !program) {
    return (
      <BussolaLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </BussolaLayout>
    );
  }

  const getStatus = (num: number): 'locked' | 'active' | 'completed' => {
    const session = sessions.find((s: any) => s.encounter_number === num);
    if (session?.status === 'completed') return 'completed';
    
    if (num === 0) {
      const wb = workbooks.find((w: any) => w.encounter_number === 0 && !w.is_prework);
      return wb?.data?.signed ? 'completed' : 'active';
    }
    
    const prevStatus = getStatus(num - 1);
    if (prevStatus === 'completed') {
      return 'active';
    }
    return 'locked';
  };

  const encounterStatuses: EncounterStatus[] = BUSSOLA_ENCOUNTERS.map(enc => {
    const preworkWb = workbooks.find((w: any) => w.encounter_number === enc.number && w.is_prework);
    const preworkDone = preworkWb?.data && Object.keys(preworkWb.data).length > 0;
    
    return {
      number: enc.number,
      title: enc.title,
      subtitle: enc.subtitle,
      status: getStatus(enc.number),
      hasPrework: !!enc.preworkItems?.length,
      preworkDone: !!preworkDone,
    };
  });

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Explorador(a)';

  return (
    <BussolaLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(280,80%,30%)] via-[hsl(300,60%,25%)] to-[hsl(320,70%,20%)] p-6 border border-white/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-400/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-400/15 to-transparent rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👋</span>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300/80">Bem-vindo(a) de volta</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              Olá, {userName}!
            </h2>
            <p className="text-sm text-white/50 max-w-md">
              Cada fase te leva mais perto de descobrir seu caminho. Sem pressa, sem pressão — no seu ritmo.
            </p>

            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white/80">5 Fases</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <Rocket className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-semibold text-white/80">Individual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <JourneyTimeline encounters={encounterStatuses} programId={program.id} />
      </div>
    </BussolaLayout>
  );
}
