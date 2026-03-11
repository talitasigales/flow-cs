import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Compass, ChevronLeft } from 'lucide-react';
import grouLogo from '@/assets/grou-logo-laranja.png';

interface BussolaLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function BussolaLayout({ children, title, showBack }: BussolaLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/bussola';

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {showBack && !isHome && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/bussola')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <img src={grouLogo} alt="Grou" className="h-8" />
            <div className="flex items-center gap-2 text-primary">
              <Compass className="h-5 w-5" />
              <span className="font-bold text-lg">Bússola</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Title bar */}
      {title && (
        <div className="border-b bg-white/50">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
