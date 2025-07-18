import AuthLayout from "@/components/AuthLayout";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { BetProvider } from "@/context/BetContext";
import { CompetitionProvider } from "@/context/CompetitionContext";
import BetForm from "@/pages/BetForm";
import BetList from "@/pages/BetList";
import Dashboard from "@/pages/Dashboard";
import { Login } from '@/pages/Login';
import { NewPassword } from '@/pages/NewPassword';
import Register from "@/pages/Register";
import { ResetPassword } from '@/pages/ResetPassword';
import Settings from "@/pages/Settings";
import SurebetCalculator from "@/pages/SurebetCalculator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AnalysisTab from "./pages/AnalysisTab";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="bet-tracker-theme">
      <TooltipProvider>
        <BetProvider>
          <AuthProvider>
            <CompetitionProvider>
              <Toaster />
              <Sonner />
              <Router>
              <Routes>
                {/* Auth routes */}
                <Route path="/" element={
                  <AuthLayout>
                    <Outlet />
                  </AuthLayout>
                }>
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="recuperar-senha" element={<ResetPassword />} />
                  <Route path="nova-senha" element={<NewPassword />} />
                </Route>
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={
                    <Layout>
                      <Outlet />
                    </Layout>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="apostas" element={<BetList />} />
                    <Route path="nova-aposta" element={<BetForm />} />
                    <Route path="editar-aposta/:id" element={<BetForm />} />
                    <Route path="analise" element={<AnalysisTab />} />
                    <Route path="calculadora-surebet" element={<SurebetCalculator />} />
                    <Route path="configuracoes" element={<Settings />} />
                  </Route>
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </CompetitionProvider>
        </AuthProvider>
      </BetProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
