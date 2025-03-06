// betContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Bet,
  DashboardStats,
  DailyStats,
  MonthlyStats,
  Tipster,
  Market,
  Competition,
  Team,
  Bookmaker,
} from "@/types";
import {
  calculateDashboardStats,
  calculateDailyStats,
  calculateMonthlyStats,
  fillMissingDays,
} from "@/lib/bet-utils";
import { toast } from "sonner";
import { brazilianBookmakers } from "@/data/bookmakers";
import { competitions } from "@/data/competitions";
import { teams } from "@/data/teams";
import { supabase } from "@/services/supabaseClient";

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
  setUnitValue: (value: number) => void;

  // New entities
  tipsters: Tipster[];
  addTipster: (tipster: Tipster) => void;
  updateTipster: (tipster: Tipster) => void;
  deleteTipster: (id: string) => void;

  markets: Market[];
  addMarket: (market: Market) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (id: string) => void;

  bookmakers: Bookmaker[];
  competitions: Competition[];
  teams: Team[];
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
  const [unitValue, setUnitValueState] = useState<number>(10); // Default unit value

  // Entities em localStorage (caso queira migrar, replicar a lógica do "bets")
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [bookmakers, setBookmakers] =
    useState<Bookmaker[]>(brazilianBookmakers);

  // Predefinidos
  const [competitionsList] = useState<Competition[]>(competitions);
  const [teamsList] = useState<Team[]>(teams);

  // --------------------------------------------------
  // 1) Carrega as apostas do Supabase (em vez do localStorage)
  // --------------------------------------------------
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      try {
        const { data, error } = await supabase.from("bets").select("*");

        if (error) {
          console.error("Erro ao buscar bets no Supabase:", error);
          toast.error("Erro ao carregar dados do Supabase!");
        } else if (data) {
          // data já vem como array de objetos
          setBets(data as Bet[]);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar dados:", err);
        toast.error("Erro inesperado ao carregar dados do Supabase!");
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromSupabase();
  }, []);

  // --------------------------------------------------
  // 2) Carrega tipsters, markets e unitValue do localStorage (mantido como exemplo)
  // --------------------------------------------------
  useEffect(() => {
    try {
      const savedUnitValue = localStorage.getItem("unitValue");
      const savedTipsters = localStorage.getItem("tipsters");
      const savedMarkets = localStorage.getItem("markets");

      if (savedUnitValue) {
        setUnitValueState(parseFloat(savedUnitValue));
      }
      if (savedTipsters) {
        setTipsters(JSON.parse(savedTipsters));
      }
      if (savedMarkets) {
        setMarkets(JSON.parse(savedMarkets));
      }
    } catch (error) {
      console.error("Error loading local data:", error);
      toast.error("Erro ao carregar dados locais!");
    }
  }, []);

  // --------------------------------------------------
  // 3) Recalcula estatísticas sempre que "bets" mudar
  // --------------------------------------------------
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

  // --------------------------------------------------
  // 4) Salva unitValue, tipsters e markets no localStorage quando mudam
  // --------------------------------------------------
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("unitValue", unitValue.toString());
    }
  }, [unitValue, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("tipsters", JSON.stringify(tipsters));
    }
  }, [tipsters, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("markets", JSON.stringify(markets));
    }
  }, [markets, isLoading]);

  // --------------------------------------------------
  // 5) Funções de CRUD no Supabase
  // --------------------------------------------------
  const addBet = async (bet: Bet) => {
    // Converte o objeto para o formato snake_case
    const supabaseBet = {
      id: bet.id,
      date: bet.date,
      tipster: bet.tipster,
      competition: bet.competition,
      bet_type: bet.type, // convertendo "type" para "bet_type"
      home_team: bet.homeTeam, // convertendo "homeTeam" para "home_team"
      away_team: bet.awayTeam, // convertendo "awayTeam" para "away_team"
      market: bet.market,
      bookmaker: bet.bookmaker,
      entry: bet.entry,
      odds: bet.odds,
      stake: bet.stake,
      unit_value: bet.unitValue, // convertendo "unitValue" para "unit_value"
      stake_units: bet.stakeUnits, // convertendo "stakeUnits" para "stake_units"
      commission: bet.commission,
      result: bet.result,
      profit_currency: bet.profitCurrency, // convertendo "profitCurrency" para "profit_currency"
      profit_units: bet.profitUnits, // convertendo "profitUnits" para "profit_units"
    };

    const { error } = await supabase.from("bets").insert(supabaseBet);

    if (error) {
      toast.error("Erro ao adicionar aposta!");
      console.error(error);
      return;
    }

    setBets((prev) => [...prev, bet]);
    toast.success("Aposta adicionada com sucesso!");
  };

  const updateBet = async (updatedBet: Bet) => {
    // Atualiza no Supabase
    const { error } = await supabase
      .from("bets")
      .update(updatedBet)
      .eq("id", updatedBet.id);

    if (error) {
      toast.error("Erro ao atualizar aposta!");
      console.error(error);
      return;
    }

    // Se deu certo, atualiza estado local
    setBets((prev) =>
      prev.map((bet) => (bet.id === updatedBet.id ? updatedBet : bet))
    );
    toast.success("Aposta atualizada com sucesso!");
  };

  const deleteBet = async (id: string) => {
    // Deleta do Supabase
    const { error } = await supabase.from("bets").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao remover aposta!");
      console.error(error);
      return;
    }

    // Se deu certo, atualiza estado local
    setBets((prev) => prev.filter((bet) => bet.id !== id));
    toast.success("Aposta removida com sucesso!");
  };

  // --------------------------------------------------
  // 6) Funções para "unitValue"
  // --------------------------------------------------
  const setUnitValue = (value: number) => {
    setUnitValueState(value);
    // localStorage é atualizado no useEffect
  };

  // --------------------------------------------------
  // 7) Funções CRUD para Tipsters e Markets (em localStorage por enquanto)
  // --------------------------------------------------
  const addTipster = (tipster: Tipster) => {
    setTipsters((prev) => [...prev, tipster]);
    toast.success("Tipster adicionado com sucesso!");
  };

  const updateTipster = (updatedTipster: Tipster) => {
    setTipsters((prev) =>
      prev.map((t) => (t.id === updatedTipster.id ? updatedTipster : t))
    );
    toast.success("Tipster atualizado com sucesso!");
  };

  const deleteTipster = (id: string) => {
    setTipsters((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tipster removido com sucesso!");
  };

  const addMarket = (market: Market) => {
    setMarkets((prev) => [...prev, market]);
    toast.success("Mercado adicionado com sucesso!");
  };

  const updateMarket = (updatedMarket: Market) => {
    setMarkets((prev) =>
      prev.map((m) => (m.id === updatedMarket.id ? updatedMarket : m))
    );
    toast.success("Mercado atualizado com sucesso!");
  };

  const deleteMarket = (id: string) => {
    setMarkets((prev) => prev.filter((m) => m.id !== id));
    toast.success("Mercado removido com sucesso!");
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
        competitions: competitionsList,
        teams: teamsList,
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
