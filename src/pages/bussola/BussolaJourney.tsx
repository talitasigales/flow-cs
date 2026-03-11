import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BussolaLayout } from '@/components/bussola/BussolaLayout';
import { JourneyTimeline, EncounterStatus } from '@/components/bussola/JourneyTimeline';
import { BUSSOLA_ENCOUNTERS } from '@/data/bussolaEncounters';
import { Compass, Loader2 } from 'lucide-react';

export default function BussolaJourney() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  // Get bussola program
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

  // Get sessions for this user
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

  // Get workbooks for this user
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </BussolaLayout>
    );
  }

  // Determine encounter statuses
  const getStatus = (num: number): 'locked' | 'active' | 'completed' => {
    const session = sessions.find((s: any) => s.encounter_number === num);
    if (session?.status === 'completed') return 'completed';
    
    // Welcome (0) is always active if not completed
    if (num === 0) {
      const wb = workbooks.find((w: any) => w.encounter_number === 0 && !w.is_prework);
      return wb?.data?.signed ? 'completed' : 'active';
    }
    
    // Each encounter unlocks after the previous is completed
    const prevStatus = getStatus(num - 1);
    if (prevStatus === 'completed') {
      if (session) return 'active';
      return 'active'; // auto-unlock after previous completion
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

  return (
    <BussolaLayout>
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/10 via-sky-100/50 to-amber-100/50 p-6 border border-primary/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Sua Jornada Bússola</h2>
              <p className="text-sm text-muted-foreground">5 encontros para descobrir seu caminho</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Transforme autoconhecimento em decisões conscientes sobre sua carreira. 
            Cada encontro te leva mais perto do seu futuro.
          </p>
        </div>

        {/* Timeline */}
        <JourneyTimeline encounters={encounterStatuses} programId={program.id} />
      </div>
    </BussolaLayout>
  );
}
