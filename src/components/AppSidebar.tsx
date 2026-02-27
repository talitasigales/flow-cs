import { useNavigate, useLocation } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  MessageSquare,
  Grid3x3,
  TrendingUp,
  Users,
  FileText,
  ClipboardList,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { UserAvatarMenu } from './UserAvatarMenu';
import { Separator } from '@/components/ui/separator';
import groLogo from '@/assets/grou-logo-laranja.png';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  const isActive = (path: string) => location.pathname === path;

  const mainMenuItems = [
    {
      title: 'Trilhas de Sucesso',
      icon: GraduationCap,
      path: '/dashboard',
      badge: null,
    },
    {
      title: 'Fale com a Nanda',
      icon: MessageSquare,
      path: '/chat-nanda',
      badge: null,
    },
    {
      title: 'Matriz 9Box',
      icon: Grid3x3,
      path: '/matriz-9box',
      badge: null,
    },
    {
      title: 'Evolução de Perfil PDA',
      icon: TrendingUp,
      path: '/profile-evolution',
      badge: null,
    },
    {
      title: 'PDI',
      icon: ClipboardList,
      path: '/pdi',
      badge: null,
    },
    {
      title: 'Construção de Cargos',
      icon: Briefcase,
      path: '/job-construction',
      badge: null,
    },
  ];

  const adminMenuItems = [
    {
      title: 'Gerenciar Usuários',
      icon: Users,
      path: '/admin/users',
    },
    {
      title: 'Logs',
      icon: FileText,
      path: '/admin/logs',
    },
  ];

  return (
    <Sidebar
      collapsible="none"
      className="border-r border-sidebar-border"
      variant="floating"
    >
      {/* Header com Logo e Título */}
      <SidebarHeader className="border-b border-sidebar-border/50 pb-4">
        <div className="flex items-center gap-3 px-2">
          <div className="relative group/logo">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover/logo:bg-primary/30 transition-colors" />
            <img 
              src={groLogo} 
              alt="Grou Logo" 
              className="relative h-10 w-10 object-contain transition-transform group-hover/logo:scale-110 duration-300"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-bold gradient-text whitespace-nowrap">
              CS da Grou
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Plataforma de Sucesso do Cliente
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="px-2">
        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item, index) => {
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem 
                    key={item.path}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={active}
                      className={`
                        group/item relative overflow-hidden transition-all duration-300
                        ${active 
                          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm glow-effect' 
                          : 'hover:bg-sidebar-accent/50'
                        }
                      `}
                    >
                      <div className={`
                        flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
                        ${active 
                          ? 'bg-gradient-primary text-primary-foreground shadow-md' 
                          : 'bg-muted/50 text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary'
                        }
                      `}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={`font-medium transition-colors ${active ? 'text-primary' : ''}`}>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu */}
        {isAdmin && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-2">
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item, index) => {
                    const active = isActive(item.path);
                    return (
                      <SidebarMenuItem 
                        key={item.path}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${(mainMenuItems.length + index) * 50}ms`, animationFillMode: 'both' }}
                      >
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={active}
                          className={`
                            group/item relative overflow-hidden transition-all duration-300
                            ${active 
                              ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm glow-effect' 
                              : 'hover:bg-sidebar-accent/50'
                            }
                          `}
                        >
                          <div className={`
                            flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
                            ${active 
                              ? 'bg-gradient-primary text-primary-foreground shadow-md' 
                              : 'bg-muted/50 text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary'
                            }
                          `}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className={`font-medium transition-colors ${active ? 'text-primary' : ''}`}>
                            {item.title}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer com User Avatar */}
      <SidebarFooter className="border-t border-sidebar-border/50 pt-4">
        <UserAvatarMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
