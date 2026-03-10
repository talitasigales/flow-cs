import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Auto-logout between 01:00 and 06:00 BRT (UTC-3)
  useEffect(() => {
    const checkMaintenanceWindow = () => {
      const now = new Date();
      // Get current hour in Brazil timezone (America/Sao_Paulo)
      const brHour = parseInt(
        now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })
      );
      if (brHour >= 1 && brHour < 6 && session) {
        const lastAutoLogout = localStorage.getItem('last_auto_logout');
        const today = now.toISOString().slice(0, 10);
        if (lastAutoLogout !== today) {
          localStorage.setItem('last_auto_logout', today);
          supabase.auth.signOut().then(() => {
            setUser(null);
            setSession(null);
            window.location.href = '/auth';
          });
        }
      }
    };

    // Check immediately and then every 5 minutes
    checkMaintenanceWindow();
    const interval = setInterval(checkMaintenanceWindow, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Track last access
      if (session?.user) {
        supabase.from('profiles')
          .update({ last_access_at: new Date().toISOString() })
          .eq('user_id', session.user.id)
          .then(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/auth');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
