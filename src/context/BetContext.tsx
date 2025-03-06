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

  // Tipsters CRUD via Supabase
  tipsters: Tipster[];
  addTipster: (tipster: Tipster) => Promise<void>;
  updateTipster: (tipster: Tipster) => Promise<void>;
  deleteTipster: (id: string) => Promise<void>;

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

  // Carrega tipsters via Supabase
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  // Os demais dados permanecem via localStorage ou dados fixos
  const [markets, setMarkets] = useState<Market[]>([]);
  const [bookmakers, setBookmakers] =
    useState<Bookmaker[]>(brazilianBookmakers);
  const [competitionsList] = useState<Competition[]>(competitions);
  const [teamsList] = useState<Team[]>(teams);

  // --------------------------------------------------
  // 1) Carrega as apostas do Supabase (em vez do localStorage)
  // --------------------------------------------------
  useEffect(() => {
    const loadBets = async () => {
      try {
        const { data, error } = await supabase.from("bets").select("*");
        if (error) {
          console.error("Erro ao buscar bets no Supabase:", error);
          toast.error("Erro ao carregar dados do Supabase!");
        } else if (data) {
          setBets(data as Bet[]);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar bets:", err);
        toast.error("Erro inesperado ao carregar dados do Supabase!");
      } finally {
        setIsLoading(false);
      }
    };
    loadBets();
  }, []);

  // --------------------------------------------------
  // 2) Carrega tipsters do Supabase
  // --------------------------------------------------
  useEffect(() => {
    const loadTipsters = async () => {
      try {
        const { data, error } = await supabase.from("tipsters").select("*");
        if (error) {
          console.error("Erro ao buscar tipsters do Supabase:", error);
          toast.error("Erro ao carregar tipsters do Supabase!");
        } else if (data) {
          setTipsters(data as Tipster[]);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar tipsters:", err);
        toast.error("Erro inesperado ao carregar tipsters do Supabase!");
      }
    };
    loadTipsters();
  }, []);

  // --------------------------------------------------
  // 3) Carrega markets e unitValue do localStorage (mantido como exemplo)
  // --------------------------------------------------
  useEffect(() => {
    try {
      const savedUnitValue = localStorage.getItem("unitValue");
      const savedMarkets = localStorage.getItem("markets");

      if (savedUnitValue) {
        setUnitValueState(parseFloat(savedUnitValue));
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
  // 4) Recalcula estatísticas sempre que "bets" mudar
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
  // 5) Salva unitValue e markets no localStorage quando mudam
  // --------------------------------------------------
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("unitValue", unitValue.toString());
    }
  }, [unitValue, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("markets", JSON.stringify(markets));
    }
  }, [markets, isLoading]);

  // --------------------------------------------------
  // 6) Funções de CRUD para Bets (já implementadas)
  // --------------------------------------------------
  const addBet = async (bet: Bet) => {
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
      commission: bet.commission,
      result: bet.result,
      profit_currency: bet.profitCurrency,
      profit_units: bet.profitUnits,
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
    const { error } = await supabase
      .from("bets")
      .update(updatedBet)
      .eq("id", updatedBet.id);
    if (error) {
      toast.error("Erro ao atualizar aposta!");
      console.error(error);
      return;
    }
    setBets((prev) =>
      prev.map((bet) => (bet.id === updatedBet.id ? updatedBet : bet))
    );
    toast.success("Aposta atualizada com sucesso!");
  };

  const deleteBet = async (id: string) => {
    const { error } = await supabase.from("bets").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover aposta!");
      console.error(error);
      return;
    }
    setBets((prev) => prev.filter((bet) => bet.id !== id));
    toast.success("Aposta removida com sucesso!");
  };

  // --------------------------------------------------
  // 7) Funções para "unitValue"
  // --------------------------------------------------
  const setUnitValue = (value: number) => {
    setUnitValueState(value);
  };

  // --------------------------------------------------
  // 8) Funções CRUD para Tipsters via Supabase
  // --------------------------------------------------
  const addTipster = async (tipster: Tipster) => {
    try {
      const { error } = await supabase.from("tipsters").insert(tipster);
      if (error) {
        toast.error("Erro ao adicionar tipster!");
        console.error(error);
        return;
      }
      setTipsters((prev) => [...prev, tipster]);
      toast.success("Tipster adicionado com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao adicionar tipster:", err);
      toast.error("Erro inesperado ao adicionar tipster!");
    }
  };

  const updateTipster = async (updatedTipster: Tipster) => {
    try {
      const { error } = await supabase
        .from("tipsters")
        .update({ name: updatedTipster.name })
        .eq("id", updatedTipster.id);
      if (error) {
        toast.error("Erro ao atualizar tipster!");
        console.error(error);
        return;
      }
      setTipsters((prev) =>
        prev.map((t) => (t.id === updatedTipster.id ? updatedTipster : t))
      );
      toast.success("Tipster atualizado com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao atualizar tipster:", err);
      toast.error("Erro inesperado ao atualizar tipster!");
    }
  };

  const deleteTipster = async (id: string) => {
    try {
      const { error } = await supabase.from("tipsters").delete().eq("id", id);
      if (error) {
        toast.error("Erro ao remover tipster!");
        console.error(error);
        return;
      }
      setTipsters((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tipster removido com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao remover tipster:", err);
      toast.error("Erro inesperado ao remover tipster!");
    }
  };

  // --------------------------------------------------
  // 9) Funções CRUD para Markets (mantidas em localStorage por enquanto)
  // --------------------------------------------------
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
