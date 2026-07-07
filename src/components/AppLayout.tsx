import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserAvatarMenu } from './UserAvatarMenu';
import { Menu } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className = '' }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full bg-background ${className}`}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with sidebar trigger (mobile) and user avatar (always) */}
          <header className="sticky top-0 z-40 flex items-center border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 h-14 md:hidden">
            <SidebarTrigger className="-ml-1">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm font-semibold gradient-text ml-3">Plataforma de Sucesso do Cliente</span>
          </header>
          {/* User avatar fixed top-right */}
          <div className="fixed top-3 right-4 z-50">
            <UserAvatarMenu />
          </div>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          
        </div>
      </div>
    </SidebarProvider>
  );
}
