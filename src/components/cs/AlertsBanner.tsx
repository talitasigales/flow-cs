import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  noContact: number;
  noOnboarding: number;
  decreasing: number;
}

export function AlertsBanner({ noContact, noOnboarding, decreasing }: Props) {
  const total = noContact + noOnboarding + decreasing;
  if (total === 0) return null;
  return (
    <Alert className="border-yellow-500/40 bg-yellow-500/5">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertTitle className="text-yellow-500">Alertas automáticos</AlertTitle>
      <AlertDescription className="text-sm space-y-1 mt-1">
        {noContact > 0 && <div>• <strong>{noContact}</strong> empresa(s) sem contato há mais de 45 dias.</div>}
        {noOnboarding > 0 && <div>• <strong>{noOnboarding}</strong> empresa(s) criada(s) há mais de 14 dias sem onboarding registrado.</div>}
        {decreasing > 0 && <div>• <strong>{decreasing}</strong> empresa(s) com queda de interações nos últimos 30 dias.</div>}
      </AlertDescription>
    </Alert>
  );
}
