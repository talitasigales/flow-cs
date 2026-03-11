import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BussolaLayout } from '@/components/bussola/BussolaLayout';
import { useBussolaWorkbook } from '@/hooks/useBussolaWorkbook';
import { BUSSOLA_ENCOUNTERS } from '@/data/bussolaEncounters';
import { WelcomeForm } from '@/components/bussola/forms/WelcomeForm';
import { Encounter1Form } from '@/components/bussola/forms/Encounter1Form';
import { Encounter2Form } from '@/components/bussola/forms/Encounter2Form';
import { Encounter3Form } from '@/components/bussola/forms/Encounter3Form';
import { Encounter4Form } from '@/components/bussola/forms/Encounter4Form';
import { Encounter5Form } from '@/components/bussola/forms/Encounter5Form';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function BussolaEncounter() {
  const { number } = useParams();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get('program') || '';
  const encounterNum = parseInt(number || '0');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const encounterMeta = BUSSOLA_ENCOUNTERS.find(e => e.number === encounterNum);

  // Main workbook
  const { data: mainData, isLoading: mainLoading, autoSave: mainAutoSave, saveNow: mainSaveNow, isSaving: mainSaving } = 
    useBussolaWorkbook({ programId, encounterNumber: encounterNum, isPrework: false });

  // Prework workbook
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </BussolaLayout>
    );
  }

  if (!encounterMeta) {
    navigate('/bussola');
    return null;
  }

  const isSaving = mainSaving || preworkSaving;

  const renderForm = () => {
    switch (encounterNum) {
      case 0:
        return <WelcomeForm data={mainData || {}} onChange={mainAutoSave} onSubmit={mainSaveNow} />;
      case 1:
        return <Encounter1Form data={mainData || {}} onChange={mainAutoSave} />;
      case 2:
        return <Encounter2Form data={mainData || {}} onChange={mainAutoSave} />;
      case 3:
        return <Encounter3Form data={mainData || {}} onChange={mainAutoSave} />;
      case 4:
        return <Encounter4Form data={mainData || {}} onChange={mainAutoSave} />;
      case 5:
        return <Encounter5Form data={mainData || {}} onChange={mainAutoSave} />;
      default:
        return <p>Encontro não encontrado.</p>;
    }
  };

  const renderPrework = () => {
    if (!encounterMeta.preworkItems?.length) return null;
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <h3 className="font-semibold text-amber-800 mb-2">📝 {encounterMeta.preworkTitle}</h3>
          <ul className="space-y-2">
            {encounterMeta.preworkItems.map((item, i) => {
              const key = `prework_${i}`;
              const checked = preworkData?.[key] || false;
              return (
                <li key={i} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => preworkAutoSave({ ...preworkData, [key]: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-amber-300"
                  />
                  <span className="text-sm text-amber-900">{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <BussolaLayout showBack title={`${encounterMeta.icon} ${encounterMeta.title}`}>
      <div className="max-w-3xl mx-auto">
        {/* Save indicator */}
        <div className="flex items-center justify-end mb-4 gap-2">
          {isSaving ? (
            <Badge variant="outline" className="gap-1">
              <Save className="h-3 w-3 animate-pulse" /> Salvando...
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
              <CheckCircle2 className="h-3 w-3" /> Salvo
            </Badge>
          )}
        </div>

        {encounterNum === 0 ? (
          renderForm()
        ) : encounterMeta.preworkItems?.length ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="prework">Pré-trabalho</TabsTrigger>
              <TabsTrigger value="main">Encontro</TabsTrigger>
            </TabsList>
            <TabsContent value="prework">{renderPrework()}</TabsContent>
            <TabsContent value="main">{renderForm()}</TabsContent>
          </Tabs>
        ) : (
          renderForm()
        )}
      </div>
    </BussolaLayout>
  );
}
