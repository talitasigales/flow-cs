import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import {
  MessageSquare,
  Mail,
  Grid3x3,
  TrendingUp,
  Users,
  FileText,
  ClipboardList,
  GraduationCap,
  Briefcase,
  User,
  Users2,
  ChevronDown,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import groLogo from '@/assets/grou-logo-laranja.png';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const { unreadCount } = useUnreadMessages();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const communityOpen = location.pathname.startsWith('/community') || location.pathname.startsWith('/messages');
  const [openCommunity, setOpenCommunity] = useState(communityOpen);

  const mainMenuItems = [
    { title: 'Trilhas de Sucesso', icon: GraduationCap, path: '/dashboard', badge: null },
    { title: 'Fale com a Nanda', icon: MessageSquare, path: '/chat-nanda', badge: null },
    { title: 'Matriz 9Box', icon: Grid3x3, path: '/matriz-9box', badge: null },
    { title: 'Evolução de Perfil PDA', icon: TrendingUp, path: '/profile-evolution', badge: null },
    { title: 'PDI', icon: ClipboardList, path: '/pdi', badge: null },
    { title: 'Construção de Cargos', icon: Briefcase, path: '/job-construction', badge: null },
    { title: 'Meu Perfil', icon: User, path: '/profile', badge: null },
  ];

  const adminMenuItems = [
    { title: 'Gerenciar Usuários', icon: Users, path: '/admin/users' },
    { title: 'Logs', icon: FileText, path: '/admin/logs' },
  ];

  const renderMenuItem = (item: { title: string; icon: any; path: string; badge?: string | null }, index: number, delayOffset = 0) => {
    const active = isActive(item.path);
    return (
      <SidebarMenuItem
        key={item.path}
        className="animate-fade-in-up"
        style={{ animationDelay: `${(delayOffset + index) * 50}ms`, animationFillMode: 'both' }}
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
  };

  const communityActive = location.pathname.startsWith('/community') || location.pathname.startsWith('/messages');

  return (
    <Sidebar
      collapsible="none"
      className="border-r border-sidebar-border"
      variant="floating"
    >
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
            <h2 className="text-lg font-bold gradient-text whitespace-nowrap">CS da Grou</h2>
            <p className="text-xs text-muted-foreground truncate">Plataforma de Sucesso do Cliente</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item, index) => renderMenuItem(item, index))}

              {/* Comunidade com sub-item Mensagens */}
              <SidebarMenuItem
                className="animate-fade-in-up"
                style={{ animationDelay: `${mainMenuItems.length * 50}ms`, animationFillMode: 'both' }}
              >
                <Collapsible open={openCommunity} onOpenChange={setOpenCommunity}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={communityActive}
                      className={`
                        group/item relative overflow-hidden transition-all duration-300 w-full
                        ${communityActive
                          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm glow-effect'
                          : 'hover:bg-sidebar-accent/50'
                        }
                      `}
                    >
                      <div className={`
                        flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
                        ${communityActive
                          ? 'bg-gradient-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary'
                        }
                      `}>
                        <Users2 className="w-4 h-4" />
                      </div>
                      <span className={`font-medium transition-colors flex-1 ${communityActive ? 'text-primary' : ''}`}>
                        Comunidade
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openCommunity ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="ml-6 mt-1 space-y-0.5 border-l border-border/50 pl-3">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => navigate('/community')}
                          isActive={isActive('/community')}
                          className={`text-sm h-8 transition-colors ${isActive('/community') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Users2 className="w-3.5 h-3.5" />
                          <span>Feed</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => navigate('/messages')}
                          isActive={location.pathname.startsWith('/messages')}
                          className={`text-sm h-8 transition-colors ${location.pathname.startsWith('/messages') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Mensagens</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0 rounded-full min-w-[18px] text-center">
                              {unreadCount}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-2">
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item, index) => renderMenuItem(item, index, mainMenuItems.length + 1))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 pt-4">
        <UserAvatarMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
