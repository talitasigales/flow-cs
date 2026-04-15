import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CSATPrompt {
  triggerType: 'login_5th' | 'module_complete' | 'first_use_feature';
  triggerReference: string;
  question: string;
}

export function useCSAT() {
  const { user } = useAuth();
  const [pending, setPending] = useState<CSATPrompt | null>(null);
  const [existingTriggers, setExistingTriggers] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load all existing CSAT responses for user
  useEffect(() => {
    if (!user) return;
    supabase
      .from('csat_responses' as any)
      .select('trigger_type, trigger_reference')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const keys = new Set((data as any[]).map(
            (r: any) => `${r.trigger_type}::${r.trigger_reference}`
          ));
          setExistingTriggers(keys);
        }
        setLoaded(true);
      });
  }, [user]);

  const hasAnswered = useCallback((type: string, ref: string) => {
    return existingTriggers.has(`${type}::${ref}`);
  }, [existingTriggers]);

  const triggerLoginCSAT = useCallback(async () => {
    if (!user || !loaded) return;
    if (hasAnswered('login_5th', 'platform')) return;

    // Count login entries in audit_logs
    const { count } = await supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action', 'LOGIN');

    if (count !== null && count >= 5) {
      setPending({
        triggerType: 'login_5th',
        triggerReference: 'platform',
        question: 'O que você está achando da plataforma até agora?',
      });
    }
  }, [user, loaded, hasAnswered]);

  const triggerModuleCSAT = useCallback((moduleId: string, moduleTitle: string) => {
    if (!user || !loaded) return;
    if (hasAnswered('module_complete', moduleId)) return;
    setPending({
      triggerType: 'module_complete',
      triggerReference: moduleId,
      question: `O que você achou do conteúdo do módulo "${moduleTitle}"?`,
    });
  }, [user, loaded, hasAnswered]);

  const triggerFirstUseCSAT = useCallback((featureKey: string, featureLabel: string) => {
    if (!user || !loaded) return;
    if (hasAnswered('first_use_feature', featureKey)) return;
    setPending({
      triggerType: 'first_use_feature',
      triggerReference: featureKey,
      question: `Essa foi sua primeira vez usando "${featureLabel}". O que achou?`,
    });
  }, [user, loaded, hasAnswered]);

  const submitCSAT = useCallback(async (rating: number, comment: string) => {
    if (!user || !pending) return;
    await supabase.from('csat_responses' as any).insert({
      user_id: user.id,
      trigger_type: pending.triggerType,
      trigger_reference: pending.triggerReference,
      rating,
      comment,
      dismissed: false,
    } as any);
    setExistingTriggers(prev => {
      const next = new Set(prev);
      next.add(`${pending.triggerType}::${pending.triggerReference}`);
      return next;
    });
    setPending(null);
  }, [user, pending]);

  const dismissCSAT = useCallback(async () => {
    if (!user || !pending) return;
    await supabase.from('csat_responses' as any).insert({
      user_id: user.id,
      trigger_type: pending.triggerType,
      trigger_reference: pending.triggerReference,
      rating: 3,
      comment: '',
      dismissed: true,
    } as any);
    setExistingTriggers(prev => {
      const next = new Set(prev);
      next.add(`${pending.triggerType}::${pending.triggerReference}`);
      return next;
    });
    setPending(null);
  }, [user, pending]);

  return {
    pending,
    triggerLoginCSAT,
    triggerModuleCSAT,
    triggerFirstUseCSAT,
    submitCSAT,
    dismissCSAT,
    loaded,
  };
}
