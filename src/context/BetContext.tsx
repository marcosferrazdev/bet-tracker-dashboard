import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import {
  Bet,
  Bookmaker,
  Competition,
  DailyStats,
  DashboardStats,
  Market,
  MonthlyStats,
  Team,
  Tipster,
} from "../types";
import { toast } from "sonner";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { competitions } from "../data/competitions";
import {
  calculateDailyStats,
  calculateDashboardStats,
  calculateMonthlyStats,
  fillMissingDays,
} from "../lib/bet-utils";

// Interface para os dados brutos retornados do Supabase (snake_case)
interface SupabaseBet {
  id: string;
  date: string;
  tipster: string;
  competition: string;
  bet_type: string;
  home_team: string;
  away_team: string;
  market: string;
  bookmaker: string;
  entry: string;
  odds: number;
  stake: number;
  unit_value: number;
  stake_units: number;
  commission: number | null;
  result: string | null;
  profit_currency: number;
  profit_units: number;
  user_id: string;
}

interface SupabaseComboGame {
  id: string;
  bet_id: string;
  competition: string;
  home_team: string;
  away_team: string;
  user_id: string;
}

interface BetContextType {
  bets: Bet[];
  addBet: (bet: Bet) => Promise<void>;
  updateBet: (bet: Bet) => Promise<void>;
  deleteBet: (id: string) => Promise<void>;
  stats: DashboardStats;
  dailyStats: DailyStats[];
  monthlyStats: MonthlyStats[];
  isLoading: boolean;
  unitValue: number;
  setUnitValue: (value: number) => Promise<void>;
  tipsters: Tipster[];
  addTipster: (tipster: Tipster) => Promise<void>;
  updateTipster: (tipster: Tipster) => Promise<void>;
  deleteTipster: (id: string) => Promise<void>;
  markets: Market[];
  addMarket: (market: Market) => Promise<void>;
  updateMarket: (market: Market) => Promise<void>;
  deleteMarket: (id: string) => Promise<void>;
  bookmakers: Bookmaker[];
  addBookmaker: (bookmaker: Bookmaker) => Promise<void>;
  updateBookmaker: (bookmaker: Bookmaker) => Promise<void>;
  deleteBookmaker: (id: string) => Promise<void>;
  competitions: Competition[];
  teams: Team[];
  addTeam: (team: Team) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
}

const BetContext = createContext<BetContextType | undefined>(undefined);

export const BetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    refundedBets: 0,
    pendingBets: 0,
    hitRate: 0,
    profitCurrency: 0,
    profitUnits: 0,
    roi: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unitValue, setUnitValueState] = useState<number>(10);

  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [competitionsList] = useState<Competition[]>(competitions);

  // Verifica mudanças no estado de autenticação e recarrega os dados
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Quando o estado da autenticação mudar, recarregar os dados
      if (session) {
        // Usuário autenticado, carrega os dados
        loadAllData();
      } else {
        // Usuário deslogado, limpa os dados
        setBets([]);
        setTipsters([]);
        setMarkets([]);
        setTeamsList([]);
        setBookmakers([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para carregar todos os dados do usuário
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Obtém o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Usuário não autenticado ao carregar dados");
        setIsLoading(false);
        return;
      }
      
      // Carrega apostas
      await loadBets(user.id);
      
      // Carrega tipsters
      await loadTipsters(user.id);
      
      // Carrega markets
      await loadMarkets(user.id);
      
      // Carrega teams
      await loadTeams(user.id);
      
      // Carrega bookmakers
      await loadBookmakers(user.id);

      // Carrega unit_values
      await loadUnitValue(user.id);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados do Supabase!");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar apostas
  const loadBets = async (userId: string) => {
    try {
      const { data: betsData, error: betsError } = await supabase
        .from("bets")
        .select("*")
        .eq("user_id", userId);
        
      if (betsError) {
        console.error("Erro ao buscar bets no Supabase:", betsError);
        toast.error("Erro ao carregar apostas do Supabase!");
        return;
      }

      const { data: comboData, error: comboError } = await supabase
        .from("combo_games")
        .select("*")
        .eq("user_id", userId);
        
      if (comboError) {
        console.error("Erro ao buscar combo_games no Supabase:", comboError);
        toast.error("Erro ao carregar jogos adicionais do Supabase!");
        return;
      }

      const mappedBets = betsData.map((row: SupabaseBet) => {
        const comboGames = comboData
          .filter((combo: SupabaseComboGame) => combo.bet_id === row.id)
          .map((combo: SupabaseComboGame) => ({
            competition: combo.competition,
            homeTeam: combo.home_team,
            awayTeam: combo.away_team,
          }));

        return {
          id: row.id,
          date: row.date,
          tipster: row.tipster,
          competition: row.competition,
          type: row.bet_type as Bet["type"],
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          market: row.market,
          bookmaker: row.bookmaker,
          entry: row.entry,
          odds: row.odds,
          stake: row.stake,
          unitValue: row.unit_value,
          stakeUnits: row.stake_units,
          commission: row.commission ?? undefined,
          result: row.result as Bet["result"],
          profitCurrency: row.profit_currency,
          profitUnits: row.profit_units,
          userId: row.user_id,
          ...(comboGames.length > 0 && { comboGames }),
        };
      });

      setBets(mappedBets);
    } catch (err) {
      console.error("Erro inesperado ao carregar bets:", err);
      toast.error("Erro inesperado ao carregar apostas!");
    }
  };

  // Função para carregar tipsters
  const loadTipsters = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("tipsters")
        .select("*")
        .eq("user_id", userId);
        
      if (error) throw error;
      setTipsters(data as Tipster[]);
    } catch (err) {
      console.error("Erro ao carregar tipsters:", err);
      toast.error("Erro ao carregar tipsters!");
    }
  };

  // Função para carregar markets
  const loadMarkets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("user_id", userId);
        
      if (error) throw error;
      setMarkets(data as Market[]);
    } catch (err) {
      console.error("Erro ao carregar markets:", err);
      toast.error("Erro ao carregar mercados!");
    }
  };

  // Função para carregar teams
  const loadTeams = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("user_id", userId);
        
      if (error) throw error;
      setTeamsList(data as Team[]);
    } catch (err) {
      console.error("Erro ao carregar teams:", err);
      toast.error("Erro ao carregar times!");
    }
  };

  // Função para carregar bookmakers
  const loadBookmakers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookmakers")
        .select("*")
        .eq("user_id", userId);
        
      if (error) throw error;
      setBookmakers(data as Bookmaker[]);
    } catch (err) {
      console.error("Erro ao carregar bookmakers:", err);
      toast.error("Erro ao carregar casas de apostas!");
    }
  };

  // Função para carregar unit_values
  const loadUnitValue = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("unit_values")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        setUnitValueState(data.value);
      } else {
        // Tenta carregar do localStorage se não encontrar no Supabase
        try {
          const savedUnitValue = localStorage.getItem("unitValue");
          if (savedUnitValue) {
            setUnitValueState(parseFloat(savedUnitValue));
          }
        } catch (error) {
          console.error("Erro ao carregar unitValue do localStorage:", error);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar unitValue:", err);
      toast.error("Erro ao carregar valor da unidade!");
    }
  };

  // Carrega dados apenas ao iniciar o aplicativo 
  // (substitui os useEffects individuais)
  useEffect(() => {
    loadAllData();
  }, []);

  // Recalcula estatísticas quando bets mudam
  useEffect(() => {
    if (!isLoading) {
      const newStats = calculateDashboardStats(bets);
      const newDailyStats = fillMissingDays(calculateDailyStats(bets));
      const newMonthlyStats = calculateMonthlyStats(bets);
      setStats(newStats);
      setDailyStats(newDailyStats);
      setMonthlyStats(newMonthlyStats);
    }
  }, [bets, isLoading]);

  // Função para atualizar unitValue
  const setUnitValue = async (value: number) => {
    setUnitValueState(value);
    
    try {
      // Obtém o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Usuário não autenticado ao atualizar unitValue");
        return;
      }
      
      // Verifica se já existe um registro para este usuário
      const { data, error: selectError } = await supabase
        .from("unit_values")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (selectError) throw selectError;
      
      if (data) {
        // Atualiza o registro existente
        const { error: updateError } = await supabase
          .from("unit_values")
          .update({ value, user_id: user.id })
          .eq("id", data.id);
          
        if (updateError) throw updateError;
      } else {
        // Cria um novo registro
        const { error: insertError } = await supabase
          .from("unit_values")
          .insert({ 
            id: crypto.randomUUID(), 
            value, 
            user_id: user.id 
          });
          if (insertError) {
            console.error('Erro ao inserir unitValue:', insertError);
            throw insertError;
          }
      }
      
      // Salva também no localStorage como backup
      localStorage.setItem("unitValue", value.toString());
    } catch (error) {
      console.error("Erro ao salvar unitValue:", error);
      toast.error("Erro ao salvar valor da unidade!");
    }
  };

  // Salva unitValue no localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("unitValue", unitValue.toString());
    }
  }, [unitValue, isLoading]);

  // Funções CRUD para Bets
  const addBet = async (bet: Bet) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    const supabaseBet = {
      id: bet.id,
      date: bet.date,
      tipster: bet.tipster,
      competition: bet.competition,
      bet_type: bet.type,
      home_team: bet.homeTeam,
      away_team: bet.awayTeam,
      market: bet.market,
      bookmaker: bet.bookmaker,
      entry: bet.entry,
      odds: bet.odds,
      stake: bet.stake,
      unit_value: bet.unitValue,
      stake_units: bet.stakeUnits,
      commission: bet.commission ?? undefined,
      result: bet.result,
      profit_currency: bet.profitCurrency,
      profit_units: bet.profitUnits,
      user_id: user.id, // Adiciona user_id do usuário autenticado
    };

    try {
      const { error: betError } = await supabase
        .from("bets")
        .insert(supabaseBet);
      if (betError) throw betError;

      // Insere os comboGames, se existirem
      if (bet.comboGames && bet.comboGames.length > 0) {
        const comboGamesData = bet.comboGames.map((game, index) => ({
          id: `${bet.id}-combo-${index}`, // Gera um ID único para cada jogo adicional
          bet_id: bet.id,
          competition: game.competition,
          home_team: game.homeTeam,
          away_team: game.awayTeam,
          user_id: user.id, // Adiciona user_id do usuário autenticado
        }));
        const { error: comboError } = await supabase
          .from("combo_games")
          .insert(comboGamesData);
        if (comboError) throw comboError;
      }

      setBets((prev) => [...prev, bet]);
      toast.success("Aposta adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar aposta:", error);
      toast.error("Erro ao adicionar aposta!");
    }
  };

  const updateBet = async (updatedBet: Bet) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    const supabaseBet = {
      date: updatedBet.date,
      tipster: updatedBet.tipster,
      competition: updatedBet.competition,
      bet_type: updatedBet.type,
      home_team: updatedBet.homeTeam,
      away_team: updatedBet.awayTeam,
      market: updatedBet.market,
      bookmaker: updatedBet.bookmaker,
      entry: updatedBet.entry,
      odds: updatedBet.odds,
      stake: updatedBet.stake,
      unit_value: updatedBet.unitValue,
      stake_units: updatedBet.stakeUnits,
      commission: updatedBet.commission ?? undefined,
      result: updatedBet.result,
      profit_currency: updatedBet.profitCurrency,
      profit_units: updatedBet.profitUnits,
      user_id: user.id, // Adiciona/atualiza user_id do usuário autenticado
    };

    try {
      const { error: betError } = await supabase
        .from("bets")
        .update(supabaseBet)
        .eq("id", updatedBet.id);
      if (betError) throw betError;

      // Remove os comboGames existentes
      const { error: deleteError } = await supabase
        .from("combo_games")
        .delete()
        .eq("bet_id", updatedBet.id);
      if (deleteError) throw deleteError;

      // Insere os novos comboGames, se existirem
      if (updatedBet.comboGames && updatedBet.comboGames.length > 0) {
        const comboGamesData = updatedBet.comboGames.map((game, index) => ({
          id: `${updatedBet.id}-combo-${index}`, // Gera um ID único para cada jogo adicional
          bet_id: updatedBet.id,
          competition: game.competition,
          home_team: game.homeTeam,
          away_team: game.awayTeam,
          user_id: user.id, // Adiciona user_id do usuário autenticado
        }));
        const { error: comboError } = await supabase
          .from("combo_games")
          .insert(comboGamesData);
        if (comboError) throw comboError;
      }

      setBets((prev) =>
        prev.map((bet) => (bet.id === updatedBet.id ? updatedBet : bet))
      );
      toast.success("Aposta atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar aposta:", error);
      toast.error("Erro ao atualizar aposta!");
    }
  };

  const deleteBet = async (id: string) => {
    try {
      // Remove os comboGames associados
      const { error: comboError } = await supabase
        .from("combo_games")
        .delete()
        .eq("bet_id", id);
      if (comboError) throw comboError;

      const { error: betError } = await supabase
        .from("bets")
        .delete()
        .eq("id", id);
      if (betError) throw betError;

      setBets((prev) => prev.filter((bet) => bet.id !== id));
      toast.success("Aposta removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover aposta:", error);
      toast.error("Erro ao remover aposta!");
    }
  };

  // Funções CRUD para Tipsters
  const addTipster = async (tipster: Tipster) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      const { error } = await supabase.from("tipsters").insert({
        ...tipster,
        user_id: user.id, // Adiciona user_id do usuário autenticado
      });
      if (error) throw error;
      setTipsters((prev) => [...prev, tipster]);
      toast.success("Tipster adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar tipster:", error);
      toast.error("Erro ao adicionar tipster!");
    }
  };

  const updateTipster = async (tipster: Tipster) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("tipsters")
        .update({
          ...tipster,
          user_id: user.id, // Adiciona/atualiza user_id do usuário autenticado
        })
        .eq("id", tipster.id);
      if (error) throw error;
      setTipsters((prev) =>
        prev.map((t) => (t.id === tipster.id ? tipster : t))
      );
      toast.success("Tipster atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar tipster:", error);
      toast.error("Erro ao atualizar tipster!");
    }
  };

  const deleteTipster = async (id: string) => {
    try {
      const { error } = await supabase.from("tipsters").delete().eq("id", id);
      if (error) throw error;
      setTipsters((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tipster removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover tipster:", error);
      toast.error("Erro ao remover tipster!");
    }
  };

  // Funções CRUD para Markets
  const addMarket = async (market: Market) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      const { error } = await supabase.from("markets").insert({
        ...market,
        user_id: user.id, // Adiciona user_id do usuário autenticado
      });
      if (error) throw error;
      setMarkets((prev) => [...prev, market]);
      toast.success("Mercado adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar mercado:", error);
      toast.error("Erro ao adicionar mercado!");
    }
  };

  const updateMarket = async (market: Market) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("markets")
        .update({
          ...market,
          user_id: user.id, // Adiciona/atualiza user_id do usuário autenticado
        })
        .eq("id", market.id);
      if (error) throw error;
      setMarkets((prev) =>
        prev.map((m) => (m.id === market.id ? market : m))
      );
      toast.success("Mercado atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar mercado:", error);
      toast.error("Erro ao atualizar mercado!");
    }
  };

  const deleteMarket = async (id: string) => {
    try {
      const { error } = await supabase.from("markets").delete().eq("id", id);
      if (error) throw error;
      setMarkets((prev) => prev.filter((m) => m.id !== id));
      toast.success("Mercado removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover mercado:", error);
      toast.error("Erro ao remover mercado!");
    }
  };

  // Funções CRUD para Bookmakers
  const refetchBookmakers = async () => {
    try {
      // Obtém o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Usuário não autenticado ao recarregar bookmakers");
        return;
      }
      
      const { data, error } = await supabase
        .from("bookmakers")
        .select("*")
        .eq("user_id", user.id);  // Filtra apenas bookmakers do usuário atual
        
      if (error) throw error;
      setBookmakers(data as Bookmaker[]);
    } catch (error) {
      console.error("Erro ao recarregar bookmakers:", error);
      toast.error("Erro ao atualizar lista de casas de apostas!");
    }
  };

  const addBookmaker = async (bookmaker: Bookmaker) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      // Verifica se já existe uma casa com o mesmo nome para este usuário
      const { data: existingBookmaker, error: checkError } = await supabase
        .from("bookmakers")
        .select("id")
        .eq("name", bookmaker.name)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingBookmaker) {
        throw new Error('Já existe uma casa de apostas com este nome');
      }

      const { error: insertError } = await supabase.from("bookmakers").insert({
        id: bookmaker.id,
        name: bookmaker.name,
        user_id: user.id,
      });

      if (insertError) {
        console.error('Erro ao adicionar casa de apostas:', insertError);
        throw insertError;
      }

      await refetchBookmakers();
      toast.success("Casa de apostas adicionada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao adicionar casa de apostas:", error);
      if (error.message === 'Já existe uma casa de apostas com este nome') {
        toast.error(error.message);
      } else {
        toast.error("Erro ao adicionar casa de apostas!");
      }
      throw error;
    }
  };

  const updateBookmaker = async (bookmaker: Bookmaker) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("bookmakers")
        .update({
          ...bookmaker,
          user_id: user.id, // Adiciona/atualiza user_id do usuário autenticado
        })
        .eq("id", bookmaker.id);
      if (error) throw error;
      await refetchBookmakers();
      toast.success("Casa de apostas atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar casa de apostas:", error);
      toast.error("Erro ao atualizar casa de apostas!");
    }
  };

  const deleteBookmaker = async (id: string) => {
    try {
      const { error } = await supabase.from("bookmakers").delete().eq("id", id);
      if (error) throw error;
      await refetchBookmakers();
      toast.success("Casa de apostas removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover casa de apostas:", error);
      toast.error("Erro ao remover casa de apostas!");
    }
  };

  // Funções CRUD para Teams
  const refetchTeams = async () => {
    try {
      // Obtém o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Usuário não autenticado ao recarregar times");
        return;
      }
      
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("user_id", user.id);  // Filtra apenas times do usuário atual
        
      if (error) throw error;
      setTeamsList(data as Team[]);
    } catch (error) {
      console.error("Erro ao recarregar times:", error);
      toast.error("Erro ao atualizar lista de times!");
    }
  };

  const addTeam = async (team: Team) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      const { error } = await supabase.from("teams").insert({
        ...team,
        user_id: user.id, // Adiciona user_id do usuário autenticado
      });
      if (error) throw error;
      await refetchTeams();
      toast.success("Time adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar time:", error);
      toast.error("Erro ao adicionar time!");
    }
  };

  const updateTeam = async (team: Team) => {
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("teams")
        .update({
          ...team,
          user_id: user.id, // Adiciona/atualiza user_id do usuário autenticado
        })
        .eq("id", team.id);
      if (error) throw error;
      await refetchTeams();
      toast.success("Time atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar time:", error);
      toast.error("Erro ao atualizar time!");
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
      await refetchTeams();
      toast.success("Time removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover time:", error);
      toast.error("Erro ao remover time!");
    }
  };

  return (
    <BetContext.Provider
      value={{
        bets,
        addBet,
        updateBet,
        deleteBet,
        stats,
        dailyStats,
        monthlyStats,
        isLoading,
        unitValue,
        setUnitValue,
        tipsters,
        addTipster,
        updateTipster,
        deleteTipster,
        markets,
        addMarket,
        updateMarket,
        deleteMarket,
        bookmakers,
        addBookmaker,
        updateBookmaker,
        deleteBookmaker,
        competitions: competitionsList,
        teams: teamsList,
        addTeam,
        updateTeam,
        deleteTeam,
      }}
    >
      {children}
    </BetContext.Provider>
  );
};

export const useBets = () => {
  const context = useContext(BetContext);
  if (context === undefined) {
    throw new Error("useBets must be used within a BetProvider");
  }
  return context;
};