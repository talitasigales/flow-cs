import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
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
          {/* Mobile header with sidebar trigger */}
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 h-14 md:hidden">
            <SidebarTrigger className="-ml-1">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm font-semibold gradient-text">CS da Grou</span>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
