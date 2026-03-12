import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BussolaLayout } from '@/components/bussola/BussolaLayout';
import { useBussolaWorkbook } from '@/hooks/useBussolaWorkbook';
import { BUSSOLA_ENCOUNTERS } from '@/data/bussolaEncounters';
import { WelcomeForm } from '@/components/bussola/forms/WelcomeForm';
import { Encounter1Form } from '@/components/bussola/forms/Encounter1Form';
import { Encounter2Form } from '@/components/bussola/forms/Encounter2Form';
import { Encounter3Form } from '@/components/bussola/forms/Encounter3Form';
import { Encounter4Form } from '@/components/bussola/forms/Encounter4Form';
import { Encounter5Form } from '@/components/bussola/forms/Encounter5Form';
import { Loader2, Save, CheckCircle2, Zap } from 'lucide-react';

export default function BussolaEncounter() {
  const { number } = useParams();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get('program') || '';
  const encounterNum = parseInt(number || '0');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const encounterMeta = BUSSOLA_ENCOUNTERS.find(e => e.number === encounterNum);

  const { data: mainData, isLoading: mainLoading, autoSave: mainAutoSave, saveNow: mainSaveNow, isSaving: mainSaving } = 
    useBussolaWorkbook({ programId, encounterNumber: encounterNum, isPrework: false });

  const { data: preworkData, isLoading: preworkLoading, autoSave: preworkAutoSave, isSaving: preworkSaving } = 
    useBussolaWorkbook({ programId, encounterNumber: encounterNum, isPrework: true });

  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  if (authLoading || mainLoading) {
    return (
      <BussolaLayout showBack title={encounterMeta?.title}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </BussolaLayout>
    );
  }

  if (!encounterMeta) {
    navigate('/bussola');
    return null;
  }

  const isSaving = mainSaving || preworkSaving;
  const XP_VALUES = [50, 200, 200, 200, 200, 300];

  const renderForm = () => {
    switch (encounterNum) {
      case 0: return <WelcomeForm data={mainData || {}} onChange={mainAutoSave} onSubmit={mainSaveNow} />;
      case 1: return <Encounter1Form data={mainData || {}} onChange={mainAutoSave} />;
      case 2: return <Encounter2Form data={mainData || {}} onChange={mainAutoSave} />;
      case 3: return <Encounter3Form data={mainData || {}} onChange={mainAutoSave} />;
      case 4: return <Encounter4Form data={mainData || {}} onChange={mainAutoSave} />;
      case 5: return <Encounter5Form data={mainData || {}} onChange={mainAutoSave} />;
      default: return <p className="text-white/50">Encontro não encontrado.</p>;
    }
  };

  const renderPrework = () => {
    if (!encounterMeta.preworkItems?.length) return null;
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5">
          <h3 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
            <span>⚡</span> {encounterMeta.preworkTitle}
          </h3>
          <ul className="space-y-3">
            {encounterMeta.preworkItems.map((item, i) => {
              const key = `prework_${i}`;
              const checked = preworkData?.[key] || false;
              return (
                <li key={i} className="flex items-start gap-3">
                  <button
                    onClick={() => preworkAutoSave({ ...preworkData, [key]: !checked })}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                      checked
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-white/20 hover:border-amber-400/50'
                    }`}
                  >
                    {checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <span className={`text-sm ${checked ? 'text-white/40 line-through' : 'text-white/80'}`}>{item}</span>
                </li>
              );
            })}
          </ul>
          {encounterNum === 1 && (
            <p className="mt-3 text-xs text-amber-300/70 italic">
              📩 Você receberá o link para preenchimento do TOV por email.
            </p>
          )}
        </div>
      </div>
    );
  };

  const ENCOUNTER_GRADIENTS = [
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-400 to-yellow-500',
  ];

  return (
    <BussolaLayout showBack>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header card */}
        <div className={`rounded-2xl bg-gradient-to-r ${ENCOUNTER_GRADIENTS[encounterNum]} p-5 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                {encounterNum === 0 ? 'Início' : `Fase ${encounterNum} de 5`}
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                {encounterMeta.icon} {encounterMeta.title}
              </h2>
              <p className="text-sm text-white/70 mt-0.5">{encounterMeta.subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-bold text-white">+{XP_VALUES[encounterNum]} XP</span>
            </div>
          </div>
        </div>

        {/* Save indicator */}
        <div className="flex items-center justify-end gap-2">
          {isSaving ? (
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
              <Save className="h-3 w-3 text-white/50 animate-pulse" />
              <span className="text-xs text-white/50">Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">Salvo</span>
            </div>
          )}
        </div>

        {/* Tabs for prework */}
        {encounterNum !== 0 && encounterMeta.preworkItems?.length ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('prework')}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'prework'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                ⚡ Pré-trabalho
              </button>
              <button
                onClick={() => setActiveTab('main')}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'main'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                🎯 Encontro
              </button>
            </div>
            {activeTab === 'prework' ? renderPrework() : renderForm()}
          </div>
        ) : (
          renderForm()
        )}
      </div>
    </BussolaLayout>
  );
}
