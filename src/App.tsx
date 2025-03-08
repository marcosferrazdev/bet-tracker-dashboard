
import Layout from "@/components/Layout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BetProvider } from "@/context/BetContext";
import BetForm from "@/pages/BetForm";
import BetList from "@/pages/BetList";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AnalysisTab from "./pages/AnalysisTab";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/apostas" element={<BetList />} />
              <Route path="/nova-aposta" element={<BetForm />} />
              <Route path="/editar-aposta/:id" element={<BetForm />} />
              <Route path="/analise" element={<AnalysisTab />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </BetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
