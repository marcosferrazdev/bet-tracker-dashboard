import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Competition {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CompetitionContextType {
  competitions: Competition[];
  isLoading: boolean;
  addCompetition: (name: string) => Promise<void>;
  deleteCompetition: (id: string) => Promise<void>;
  updateCompetition: (id: string, name: string) => Promise<void>;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(undefined);

export const useCompetitions = () => {
  const context = useContext(CompetitionContext);
  if (!context) {
    throw new Error("useCompetitions must be used within a CompetitionProvider");
  }
  return context;
};

export const CompetitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("name");

      if (error) throw error;

      setCompetitions(data || []);
    } catch (error) {
      console.error("Erro ao carregar competições:", error);
      toast.error("Erro ao carregar competições");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  const addCompetition = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado!");
        return;
      }

      const { data, error } = await supabase
        .from("competitions")
        .insert([{ 
          name,
          user_id: user.id,
          id: crypto.randomUUID()
        }])
        .select()
        .single();

      if (error) throw error;

      setCompetitions((prev) => [...prev, data]);
      toast.success("Competição adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar competição:", error);
      toast.error("Erro ao adicionar competição");
    }
  };

  const updateCompetition = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("competitions")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setCompetitions((prev) =>
        prev.map((comp) => (comp.id === id ? { ...comp, name } : comp))
      );
      toast.success("Competição atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar competição:", error);
      toast.error("Erro ao atualizar competição");
    }
  };

  const deleteCompetition = async (id: string) => {
    try {
      const { error } = await supabase
        .from("competitions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCompetitions((prev) => prev.filter((comp) => comp.id !== id));
      toast.success("Competição excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir competição:", error);
      toast.error("Erro ao excluir competição");
    }
  };

  return (
    <CompetitionContext.Provider
      value={{
        competitions,
        isLoading,
        addCompetition,
        deleteCompetition,
        updateCompetition,
      }}
    >
      {children}
    </CompetitionContext.Provider>
  );
}; 