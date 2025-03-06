
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BetProvider } from "@/context/BetContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import BetList from "@/pages/BetList";
import BetForm from "@/pages/BetForm";
import Settings from "@/pages/Settings";
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
