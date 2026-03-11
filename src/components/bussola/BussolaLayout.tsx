import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Compass, ChevronLeft, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-secondary/15 blur-[120px]" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-20 right-1/3 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" style={{ animationDelay: '4s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {showBack && !isHome && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/bussola')} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <img src={grouLogo} alt="Grou" className="h-7 opacity-80" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Compass className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-black text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BÚSSOLA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs font-medium text-muted-foreground">Sua Jornada</span>
            </div>
            <Avatar className="h-8 w-8 border-2 border-primary/50 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair" className="text-muted-foreground hover:text-foreground hover:bg-muted">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Title bar */}
      {title && (
        <div className="border-b border-border/50">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <h1 className="text-2xl font-black text-foreground">{title}</h1>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="relative mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
