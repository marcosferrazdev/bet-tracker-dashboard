import Layout from "@/components/Layout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BetProvider } from "@/context/BetContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import BetForm from "@/pages/BetForm";
import BetList from "@/pages/BetList";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import { Login } from '@/pages/Login';
import Register from "@/pages/Register";
import AuthLayout from "@/components/AuthLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import AnalysisTab from "./pages/AnalysisTab";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BetProvider>
        <AuthProvider>
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
                  <Route path="configuracoes" element={<Settings />} />
                </Route>
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </BetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
