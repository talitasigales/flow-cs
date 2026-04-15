import { createContext, useContext, ReactNode } from 'react';
import { useCSAT } from '@/hooks/useCSAT';
import { CSATDialog } from '@/components/CSATDialog';
import { toast } from 'sonner';

type CSATContextType = ReturnType<typeof useCSAT>;

const CSATContext = createContext<CSATContextType | null>(null);

export function useCSATContext() {
  const ctx = useContext(CSATContext);
  if (!ctx) throw new Error('useCSATContext must be used within CSATProvider');
  return ctx;
}

export function CSATProvider({ children }: { children: ReactNode }) {
  const csat = useCSAT();

  const handleSubmit = async (rating: number, comment: string) => {
    await csat.submitCSAT(rating, comment);
    toast.success('Obrigado pelo seu feedback!');
  };

  return (
    <CSATContext.Provider value={csat}>
      {children}
      {csat.pending && (
        <CSATDialog
          open={!!csat.pending}
          question={csat.pending.question}
          onSubmit={handleSubmit}
          onDismiss={csat.dismissCSAT}
        />
      )}
    </CSATContext.Provider>
  );
}
