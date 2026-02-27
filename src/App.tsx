import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatbotNanda } from "./components/ChatbotNanda";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Module from "./pages/Module";
import Matriz9Box from "./pages/Matriz9Box";
import ProfileEvolution from "./pages/ProfileEvolution";
import ChatNanda from "./pages/ChatNanda";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import PDI from "./pages/PDI";
import PDIDetail from "./pages/PDIDetail";
import PDIGuide from "./pages/PDIGuide";
import PDICreate from "./pages/PDICreate";
import JobConstruction from "./pages/JobConstruction";
import JobConstructionResult from "./pages/JobConstructionResult";
import ResetPassword from "./pages/ResetPassword";
import ActivityHistory from "./pages/ActivityHistory";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="/pdi" element={<PDI />} />
          <Route path="/pdi/new" element={<PDICreate />} />
          <Route path="/pdi/guide" element={<PDIGuide />} />
          <Route path="/pdi/:pdiId" element={<PDIDetail />} />
          <Route path="/job-construction" element={<JobConstruction />} />
          <Route path="/job-construction/result" element={<JobConstructionResult />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/activity-history" element={<ActivityHistory />} />
          <Route path="/profile" element={<UserProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatbotNanda />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
