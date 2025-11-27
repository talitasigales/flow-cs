import { MessageCircle, Grid3x3, TrendingUp, Users, FileText, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import grouLogo from "@/assets/grou-logo-verde.webp";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const { isAdmin } = useIsAdmin();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const menuItems = [
    {
      title: "Fale com a Nanda",
      url: "/chat-nanda",
      icon: MessageCircle,
      description: "Especialista PDA",
    },
    {
      title: "Matriz 9Box",
      url: "/matriz-9box",
      icon: Grid3x3,
    },
    {
      title: "Evolução de Perfil",
      url: "/profile-evolution",
      icon: TrendingUp,
      description: "PDA",
    },
  ];

  const adminItems = isAdmin ? [
    {
      title: "Gerenciar Usuários",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Logs",
      url: "/admin/logs",
      icon: FileText,
    },
  ] : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} border-r border-border/50 bg-card/95 backdrop-blur-xl transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <img src={grouLogo} alt="Grou Logo" className="h-8 flex-shrink-0" />
          {!collapsed && (
            <div>
              <h1 className="gradient-text font-bold text-sm leading-tight">
                Plataforma de Sucesso do Cliente
              </h1>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    className={`${
                      isActive(item.url)
                        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                        : "hover:bg-muted/50"
                    } transition-colors`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && (
                      <div className="flex flex-col">
                        <span className="text-sm">{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      isActive={isActive(item.url)}
                      className={`${
                        isActive(item.url)
                          ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                          : "hover:bg-muted/50"
                      } transition-colors`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="absolute top-4 right-2">
        <SidebarTrigger className="hover:bg-muted/50 rounded-md" />
      </div>
    </Sidebar>
  );
}
