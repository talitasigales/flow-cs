import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNotifications } from '@/hooks/useNotifications';
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
  BookOpen,
  User,
  Users2,
  ChevronDown,
  Wrench,
  Sparkles,
  Video,
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

import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import groLogo from '@/assets/grou-logo-laranja.png';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

const toolsSubItems = [
  { title: 'Fale com a Nanda', icon: MessageSquare, path: '/chat-nanda' },
  { title: 'Matriz 9Box', icon: Grid3x3, path: '/matriz-9box' },
  { title: 'Evolução de Perfil PDA', icon: TrendingUp, path: '/profile-evolution' },
  { title: 'PDI', icon: ClipboardList, path: '/pdi' },
  { title: 'Construção de Cargos', icon: Briefcase, path: '/job-construction' },
];

const communitySubItems = [
  { title: 'Feed', icon: Users2, path: '/community' },
  { title: 'Membros', icon: Users, path: '/members' },
  { title: 'Mensagens', icon: Mail, path: '/messages' },
];

const toolsPaths = toolsSubItems.map(i => i.path);
const communityPaths = ['/community', '/members', '/messages'];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const { unreadCount: notifCount } = useNotifications();
  const [communityNotActivated, setCommunityNotActivated] = useState(false);
  const totalCommunityBadge = (unreadCount || 0) + (notifCount || 0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('community_visible')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data && !data.community_visible) {
          setCommunityNotActivated(true);
        }
      });
  }, [user]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isInTools = toolsPaths.some(p => isActive(p));
  const isInCommunity = communityPaths.some(p => isActive(p));

  const [openTools, setOpenTools] = useState(isInTools);
  const [openCommunity, setOpenCommunity] = useState(isInCommunity);

  const adminMenuItems = [
    { title: 'Gerenciar Usuários', icon: Users, path: '/admin/users' },
    { title: 'Logs', icon: FileText, path: '/admin/logs' },
    { title: 'Base de Conhecimento', icon: BookOpen, path: '/admin/knowledge-base' },
  ];

  const renderTopLevelItem = (title: string, icon: any, path: string, index: number) => {
    const active = isActive(path);
    const Icon = icon;
    return (
      <SidebarMenuItem
        key={path}
        className="animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
      >
        <SidebarMenuButton
          onClick={() => navigate(path)}
          isActive={active}
          className={`group/item relative overflow-hidden transition-all duration-300 ${active ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm glow-effect' : 'hover:bg-sidebar-accent/50'}`}
        >
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 ${active ? 'bg-gradient-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={`font-medium transition-colors ${active ? 'text-primary' : ''}`}>{title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderCollapsible = (
    title: string,
    Icon: any,
    isOpen: boolean,
    setOpen: (v: boolean) => void,
    isGroupActive: boolean,
    subItems: { title: string; icon: any; path: string }[],
    index: number,
    badgeCount?: number,
  ) => (
    <SidebarMenuItem
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <Collapsible open={isOpen} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isGroupActive}
            className={`group/item relative overflow-hidden transition-all duration-300 w-full ${isGroupActive ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm glow-effect' : 'hover:bg-sidebar-accent/50'}`}
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 ${isGroupActive ? 'bg-gradient-primary text-primary-foreground shadow-md' : 'bg-muted/50 text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`font-medium transition-colors flex-1 ${isGroupActive ? 'text-primary' : ''}`}>{title}</span>
            {badgeCount != null && badgeCount > 0 && (
              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{badgeCount}</span>
            )}
            {badgeCount === -1 && (
              <span className="flex items-center gap-0.5 bg-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                <Sparkles className="w-3 h-3" />
                Novo
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu className="ml-6 mt-1 space-y-0.5 border-l border-border/50 pl-3">
            {subItems.map(sub => {
              const SubIcon = sub.icon;
              const subActive = isActive(sub.path);
              const isMessages = sub.path === '/messages';
              return (
                <SidebarMenuItem key={sub.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(sub.path)}
                    isActive={subActive}
                    className={`text-sm h-8 transition-colors ${subActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    <span>{sub.title}</span>
                    {isMessages && unreadCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0 rounded-full min-w-[18px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border" variant="floating">
      <SidebarHeader className="border-b border-sidebar-border/50 pb-4">
        <div className="flex items-center gap-3 px-2">
          <div className="relative group/logo">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover/logo:bg-primary/30 transition-colors" />
            <img src={groLogo} alt="Grou Logo" className="relative h-10 w-10 object-contain transition-transform group-hover/logo:scale-110 duration-300" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-bold gradient-text whitespace-nowrap">CS da Grou</h2>
            <p className="text-xs text-muted-foreground">Plataforma de Sucesso do Cliente</p>
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
              {renderTopLevelItem('Trilhas de Sucesso', GraduationCap, '/dashboard', 0)}
              {renderTopLevelItem('Webinars', Video, '/webinars', 1)}
              {renderCollapsible('Ferramentas', Wrench, openTools, setOpenTools, isInTools, toolsSubItems, 2)}
              {renderCollapsible(
                'Comunidade',
                Users2,
                openCommunity,
                setOpenCommunity,
                isInCommunity,
                communitySubItems,
                2,
                totalCommunityBadge > 0 ? totalCommunityBadge : (communityNotActivated ? -1 : 0),
              )}
              {renderTopLevelItem('Meu Perfil', User, '/profile', 3)}
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
                  {adminMenuItems.map((item, index) => renderTopLevelItem(item.title, item.icon, item.path, index))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 pt-2 space-y-3">
        <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
          <a
            href="https://grouacademy.memberkit.com.br/invites/xNNXox/join"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors mb-2"
          >
            <GraduationCap className="w-3 h-3" />
            <span>Acessar Grou Academy</span>
          </a>
          <Separator className="mb-2" />
          <p className="text-xs font-semibold text-foreground mb-1">Precisa falar com o time de CS?</p>
          <div className="space-y-1">
            <a
              href="https://wa.me/5551920554177"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span>(51) 9205-5417</span>
            </a>
            <a
              href="mailto:cs@grougp.com.br"
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-3 h-3" />
              <span>cs@grougp.com.br</span>
            </a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
