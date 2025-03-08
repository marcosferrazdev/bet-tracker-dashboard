import { competitions } from "@/data/competitions";
import {
  calculateDailyStats,
  calculateDashboardStats,
  calculateMonthlyStats,
  fillMissingDays,
} from "@/lib/bet-utils";
import { supabase } from "@/services/supabaseClient";
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
} from "@/types";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

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
  setUnitValue: (value: number) => void;

  // Tipsters CRUD via Supabase
  tipsters: Tipster[];
  addTipster: (tipster: Tipster) => Promise<void>;
  updateTipster: (tipster: Tipster) => Promise<void>;
  deleteTipster: (id: string) => Promise<void>;

  // Markets CRUD via Supabase
  markets: Market[];
  addMarket: (market: Market) => Promise<void>;
  updateMarket: (market: Market) => Promise<void>;
  deleteMarket: (id: string) => Promise<void>;

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
  const [unitValue, setUnitValueState] = useState<number>(10); // Valor padrão

  // Tipsters carregados via Supabase
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  // Markets carregados via Supabase
  const [markets, setMarkets] = useState<Market[]>([]);
  // Teams carregados via Supabase
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  // Bookmakers carregados via Supabase (inicialmente vazio)
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [competitionsList] = useState<Competition[]>(competitions);

  // --------------------------------------------------
  // 1) Carrega as apostas do Supabase e converte para camelCase
  // --------------------------------------------------
  useEffect(() => {
    const loadBets = async () => {
      try {
        const { data, error } = await supabase.from("bets").select("*");
        if (error) {
          console.error("Erro ao buscar bets no Supabase:", error);
          toast.error("Erro ao carregar dados do Supabase!");
        } else if (data) {
          const mappedBets = data.map((row: SupabaseBet) => ({
            id: row.id,
            date: row.date,
            tipster: row.tipster,
            competition: row.competition,
            type: row.bet_type,
            homeTeam: row.home_team,
            awayTeam: row.away_team,
            market: row.market,
            bookmaker: row.bookmaker,
            entry: row.entry,
            odds: row.odds,
            stake: row.stake,
            unitValue: row.unit_value,
            stakeUnits: row.stake_units,
            commission: row.commission,
            result: row.result,
            profitCurrency: row.profit_currency,
            profitUnits: row.profit_units,
          }));
          setBets(mappedBets as Bet[]);
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
  // 3) Carrega markets do Supabase
  // --------------------------------------------------
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const { data, error } = await supabase.from("markets").select("*");
        if (error) {
          console.error("Erro ao buscar markets do Supabase:", error);
          toast.error("Erro ao carregar mercados do Supabase!");
        } else if (data) {
          setMarkets(data as Market[]);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar markets:", err);
        toast.error("Erro inesperado ao carregar mercados do Supabase!");
      }
    };
    loadMarkets();
  }, []);

  // --------------------------------------------------
  // 4) Carrega teams do Supabase
  // --------------------------------------------------
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const { data, error } = await supabase.from("teams").select("*");
        if (error) {
          console.error("Erro ao buscar teams do Supabase:", error);
          toast.error("Erro ao carregar times do Supabase!");
        } else if (data) {
          setTeamsList(data as Team[]);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar teams:", err);
        toast.error("Erro inesperado ao carregar times do Supabase!");
      }
    };
    loadTeams();
  }, []);

  // --------------------------------------------------
  // 5) Carrega bookmakers do Supabase
  // --------------------------------------------------
  useEffect(() => {
    const loadBookmakers = async () => {
      try {
        const { data, error } = await supabase.from("bookmakers").select("*");
        if (error) {
          console.error("Erro ao buscar bookmakers do Supabase:", error);
          toast.error("Erro ao carregar casas de apostas do Supabase!");
        } else if (data) {
          setBookmakers(data as Bookmaker[]);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar bookmakers:", err);
        toast.error("Erro inesperado ao carregar casas de apostas!");
      }
    };
    loadBookmakers();
  }, []);

  // --------------------------------------------------
  // 6) Carrega unitValue do localStorage (mantido)
  // --------------------------------------------------
  useEffect(() => {
    try {
      const savedUnitValue = localStorage.getItem("unitValue");
      if (savedUnitValue) {
        setUnitValueState(parseFloat(savedUnitValue));
      }
    } catch (error) {
      console.error("Error loading unitValue from localStorage:", error);
      toast.error("Erro ao carregar dados locais!");
    }
  }, []);

  // --------------------------------------------------
  // 7) Recalcula estatísticas sempre que "bets" mudar
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
  // 8) Salva unitValue no localStorage quando muda
  // --------------------------------------------------
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("unitValue", unitValue.toString());
    }
  }, [unitValue, isLoading]);

  // --------------------------------------------------
  // 9) Funções de CRUD para Bets
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
      commission: updatedBet.commission,
      result: updatedBet.result,
      profit_currency: updatedBet.profitCurrency,
      profit_units: updatedBet.profitUnits,
    };

    const { error } = await supabase
      .from("bets")
      .update(supabaseBet)
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
  // 10) Função para "unitValue"
  // --------------------------------------------------
  const setUnitValue = (value: number) => {
    setUnitValueState(value);
  };

  // --------------------------------------------------
  // 11) Funções CRUD para Tipsters via Supabase
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
  // 12) Funções CRUD para Markets via Supabase
  // --------------------------------------------------
  const addMarket = async (market: Market) => {
    try {
      const { error } = await supabase.from("markets").insert(market);
      if (error) {
        toast.error("Erro ao adicionar mercado!");
        console.error(error);
        return;
      }
      setMarkets((prev) => [...prev, market]);
      toast.success("Mercado adicionado com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao adicionar mercado:", err);
      toast.error("Erro inesperado ao adicionar mercado!");
    }
  };

  const updateMarket = async (updatedMarket: Market) => {
    try {
      const { error } = await supabase
        .from("markets")
        .update({ name: updatedMarket.name })
        .eq("id", updatedMarket.id);
      if (error) {
        toast.error("Erro ao atualizar mercado!");
        console.error(error);
        return;
      }
      setMarkets((prev) =>
        prev.map((m) => (m.id === updatedMarket.id ? updatedMarket : m))
      );
      toast.success("Mercado atualizado com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao atualizar mercado:", err);
      toast.error("Erro inesperado ao atualizar mercado!");
    }
  };

  const deleteMarket = async (id: string) => {
    try {
      const { error } = await supabase.from("markets").delete().eq("id", id);
      if (error) {
        toast.error("Erro ao remover mercado!");
        console.error(error);
        return;
      }
      setMarkets((prev) => prev.filter((m) => m.id !== id));
      toast.success("Mercado removido com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao remover mercado:", err);
      toast.error("Erro inesperado ao remover mercado!");
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
