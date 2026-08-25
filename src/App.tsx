import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CSATProvider } from "./contexts/CSATContext";
import { ChatbotNanda } from "./components/ChatbotNanda";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Module from "./pages/Module";
import Matriz9Box from "./pages/Matriz9Box";
import ProfileEvolution from "./pages/ProfileEvolution";
import ChatNanda from "./pages/ChatNanda";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import PDI from "./pages/PDI";
import PDIDetail from "./pages/PDIDetail";
import PDIGuide from "./pages/PDIGuide";
import PDICreate from "./pages/PDICreate";
import PDIShared from "./pages/PDIShared";
import JobConstruction from "./pages/JobConstruction";
import JobConstructionResult from "./pages/JobConstructionResult";
import ResetPassword from "./pages/ResetPassword";
import Community from "./pages/Community";
import Webinars from "./pages/Webinars";
import CommunityPost from "./pages/CommunityPost";
import Messages from "./pages/Messages";
import ChatConversation from "./pages/ChatConversation";
import Members from "./pages/Members";
import PublicProfile from "./pages/PublicProfile";

import ProgramGeneric from "./pages/ProgramGeneric";
import ProgramCalendar from "./pages/ProgramCalendar";
import AdminPrograms from "./pages/AdminPrograms";

import MyDevelopment from "./pages/MyDevelopment";

import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import SecurityOverview from "./pages/SecurityOverview";
import CSDashboard from "./pages/cs/CSDashboard";
import CompanyDetail from "./pages/cs/CompanyDetail";
import AdminCSAccess from "./pages/admin/AdminCSAccess";
import AdminCSImport from "./pages/admin/AdminCSImport";
import AdminChangelog from "./pages/admin/AdminChangelog";
import AdminCommunications from "./pages/admin/AdminCommunications";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <CSATProvider>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/module/:moduleId" element={<Module />} />
          <Route path="/matriz-9box" element={<Matriz9Box />} />
          <Route path="/profile-evolution" element={<ProfileEvolution />} />
          <Route path="/chat-nanda" element={<ChatNanda />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
          <Route path="/pdi" element={<PDI />} />
          <Route path="/pdi/new" element={<PDICreate />} />
          <Route path="/pdi/guide" element={<PDIGuide />} />
          <Route path="/pdi/compartilhado/:token" element={<PDIShared />} />
          <Route path="/pdi/:pdiId" element={<PDIDetail />} />
          <Route path="/job-construction" element={<JobConstruction />} />
          <Route path="/job-construction/result" element={<JobConstructionResult />} />
          <Route path="/community" element={<Community />} />
          <Route path="/webinars" element={<Webinars />} />
          <Route path="/community/:postId" element={<CommunityPost />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/members" element={<Members />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
          <Route path="/messages/:conversationId" element={<ChatConversation />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/programas/calendario" element={<ProgramCalendar />} />
          <Route path="/programas/meu-desenvolvimento" element={<MyDevelopment />} />
          
          <Route path="/programas/:slug" element={<ProgramGeneric />} />
          <Route path="/admin/programs" element={<AdminPrograms />} />
          
          
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/security" element={<SecurityOverview />} />
          <Route path="/cs" element={<CSDashboard />} />
          <Route path="/cs/empresas/:companyId" element={<CompanyDetail />} />
          <Route path="/admin/cs-access" element={<AdminCSAccess />} />
          <Route path="/admin/cs-import" element={<AdminCSImport />} />
          <Route path="/admin/changelog" element={<AdminChangelog />} />
          <Route path="/admin/comunicacoes" element={<AdminCommunications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatbotNanda />
        </CSATProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
