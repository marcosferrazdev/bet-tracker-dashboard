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
  const [competitionsList, setCompetitionsList] = useState<Competition[]>([]);

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

      // Se não houver times, insere os times padrão
      if (!data || data.length === 0) {
        await insertDefaultTeams(userId);
      }
    } catch (err) {
      console.error("Erro ao carregar teams:", err);
      toast.error("Erro ao carregar times!");
    }
  };

  // Função para inserir times padrão
  const insertDefaultTeams = async (userId: string) => {
    try {
      const defaultTeams = [
        // Arábia Saudita - Primeira Divisão
        { id: crypto.randomUUID(), name: 'Al-Ahli', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Ettifaq', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Fateh', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Fayha', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Hazem', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Hilal', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Ittihad', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Nassr', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Raed', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Shabab', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Taawoun', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Tai', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Damac', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Abha', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Adalah', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Khaleej', country: 'Arábia Saudita' },
        // Arábia Saudita - Segunda Divisão
        { id: crypto.randomUUID(), name: 'Al-Ain', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Arabi', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Diriyah', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Faisaly', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Jabalain', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Jndal', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Kawkab', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Kholood', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Nahda', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Orobah', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Qaisumah', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Qaryat', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Riyadh', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Sahel', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Sadd', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Suqoor', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Taraji', country: 'Arábia Saudita' },
        { id: crypto.randomUUID(), name: 'Al-Washm', country: 'Arábia Saudita' },
        // Brasil - Série A
        { id: crypto.randomUUID(), name: 'América-MG', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Athletico Paranaense', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Atlético Goianiense', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Atlético Mineiro', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Avaí', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Botafogo', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Ceará', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Corinthians', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Coritiba', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Cuiabá', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Flamengo', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Fluminense', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Fortaleza', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Goiás', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Internacional', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Juventude', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Palmeiras', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Red Bull Bragantino', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Santos', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'São Paulo', country: 'Brasil' },
        // Brasil - Série B
        { id: crypto.randomUUID(), name: 'Bahia', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Brusque', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Chapecoense', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'CRB', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Criciúma', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'CSA', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Guarani', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Londrina', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Náutico', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Novorizontino', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Operário-PR', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Ponte Preta', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Sampaio Corrêa', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Sport', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Tombense', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Vasco da Gama', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Vila Nova', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Ituano', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Grêmio', country: 'Brasil' },
        { id: crypto.randomUUID(), name: 'Cruzeiro', country: 'Brasil' },
        // França - Ligue 1
        { id: crypto.randomUUID(), name: 'Ajaccio', country: 'França' },
        { id: crypto.randomUUID(), name: 'Angers', country: 'França' },
        { id: crypto.randomUUID(), name: 'Auxerre', country: 'França' },
        { id: crypto.randomUUID(), name: 'Brest', country: 'França' },
        { id: crypto.randomUUID(), name: 'Clermont', country: 'França' },
        { id: crypto.randomUUID(), name: 'Lens', country: 'França' },
        { id: crypto.randomUUID(), name: 'Lille', country: 'França' },
        { id: crypto.randomUUID(), name: 'Lorient', country: 'França' },
        { id: crypto.randomUUID(), name: 'Lyon', country: 'França' },
        { id: crypto.randomUUID(), name: 'Marseille', country: 'França' },
        { id: crypto.randomUUID(), name: 'Monaco', country: 'França' },
        { id: crypto.randomUUID(), name: 'Montpellier', country: 'França' },
        { id: crypto.randomUUID(), name: 'Nantes', country: 'França' },
        { id: crypto.randomUUID(), name: 'Nice', country: 'França' },
        { id: crypto.randomUUID(), name: 'Paris Saint-Germain', country: 'França' },
        { id: crypto.randomUUID(), name: 'Reims', country: 'França' },
        { id: crypto.randomUUID(), name: 'Rennes', country: 'França' },
        { id: crypto.randomUUID(), name: 'Strasbourg', country: 'França' },
        { id: crypto.randomUUID(), name: 'Toulouse', country: 'França' },
        { id: crypto.randomUUID(), name: 'Troyes', country: 'França' },
        // França - Ligue 2
        { id: crypto.randomUUID(), name: 'Amiens', country: 'França' },
        { id: crypto.randomUUID(), name: 'Annecy', country: 'França' },
        { id: crypto.randomUUID(), name: 'Bastia', country: 'França' },
        { id: crypto.randomUUID(), name: 'Bordeaux', country: 'França' },
        { id: crypto.randomUUID(), name: 'Caen', country: 'França' },
        { id: crypto.randomUUID(), name: 'Dijon', country: 'França' },
        { id: crypto.randomUUID(), name: 'Grenoble', country: 'França' },
        { id: crypto.randomUUID(), name: 'Guingamp', country: 'França' },
        { id: crypto.randomUUID(), name: 'Laval', country: 'França' },
        { id: crypto.randomUUID(), name: 'Le Havre', country: 'França' },
        { id: crypto.randomUUID(), name: 'Metz', country: 'França' },
        { id: crypto.randomUUID(), name: 'Nîmes', country: 'França' },
        { id: crypto.randomUUID(), name: 'Niort', country: 'França' },
        { id: crypto.randomUUID(), name: 'Paris FC', country: 'França' },
        { id: crypto.randomUUID(), name: 'Pau', country: 'França' },
        { id: crypto.randomUUID(), name: 'Quevilly-Rouen', country: 'França' },
        { id: crypto.randomUUID(), name: 'Rodez', country: 'França' },
        { id: crypto.randomUUID(), name: 'Saint-Étienne', country: 'França' },
        { id: crypto.randomUUID(), name: 'Sochaux', country: 'França' },
        { id: crypto.randomUUID(), name: 'Valenciennes', country: 'França' },
        // Itália - Serie A
        { id: crypto.randomUUID(), name: 'Atalanta', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Bologna', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Cremonese', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Empoli', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Fiorentina', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Hellas Verona', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Inter de Milão', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Juventus', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Lazio', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Lecce', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Milan', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Monza', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Napoli', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Roma', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Salernitana', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Sampdoria', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Sassuolo', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Spezia', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Torino', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Udinese', country: 'Itália' },
        // Itália - Serie B
        { id: crypto.randomUUID(), name: 'Ascoli', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Bari', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Benevento', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Brescia', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Cagliari', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Cittadella', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Como', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Cosenza', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Frosinone', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Genoa', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Modena', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Palermo', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Parma', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Perugia', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Pisa', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Reggina', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'SPAL', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Südtirol', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Ternana', country: 'Itália' },
        { id: crypto.randomUUID(), name: 'Venezia', country: 'Itália' },
        // Noruega - Eliteserien
        { id: crypto.randomUUID(), name: 'Aalesund', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Bodø/Glimt', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Brann', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'HamKam', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Haugesund', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Lillestrøm', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Molde', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Odd', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Rosenborg', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Sandefjord', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Sarpsborg 08', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Stabæk', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Strømsgodset', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Tromsø', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Viking', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Vålerenga', country: 'Noruega' },
        // Noruega - 1. Divisjon
        { id: crypto.randomUUID(), name: 'Bryne', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Fredrikstad', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Hødd', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Jerv', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'KFUM Oslo', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Kongsvinger', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Mjøndalen', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Moss', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Ranheim', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Raufoss', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Sandnes Ulf', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Skeid', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Sogndal', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Start', country: 'Noruega' },
        { id: crypto.randomUUID(), name: 'Åsane', country: 'Noruega' },
        // Espanha - La Liga
        { id: crypto.randomUUID(), name: 'Alavés', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Almería', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Athletic Bilbao', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Atlético de Madrid', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Barcelona', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Cádiz', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Celta de Vigo', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Elche', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Espanyol', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Getafe', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Girona', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Granada', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Las Palmas', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Mallorca', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Osasuna', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Rayo Vallecano', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Real Betis', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Real Madrid', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Real Sociedad', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Sevilla', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Valencia', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Valladolid', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Villarreal', country: 'Espanha' },
        // Espanha - La Liga 2
        { id: crypto.randomUUID(), name: 'Albacete', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Alcorcón', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Andorra', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Burgos', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Cartagena', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Eibar', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Huesca', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Ibiza', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Leganés', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Levante', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Lugo', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Málaga', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Mirandés', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Oviedo', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Ponferradina', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Racing Santander', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Real Zaragoza', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Sporting Gijón', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Tenerife', country: 'Espanha' },
        { id: crypto.randomUUID(), name: 'Villarreal B', country: 'Espanha' },
        // Inglaterra - Premier League
        { id: crypto.randomUUID(), name: 'Arsenal', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Aston Villa', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Bournemouth', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Brentford', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Brighton & Hove Albion', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Burnley', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Chelsea', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Crystal Palace', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Everton', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Fulham', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Liverpool', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Luton Town', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Manchester City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Manchester United', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Newcastle United', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Nottingham Forest', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Sheffield United', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Tottenham Hotspur', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'West Ham United', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Wolverhampton Wanderers', country: 'Inglaterra' },
        // Inglaterra - EFL Championship
        { id: crypto.randomUUID(), name: 'Birmingham City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Blackburn Rovers', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Blackpool', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Bristol City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Cardiff City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Coventry City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Huddersfield Town', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Hull City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Luton Town', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Middlesbrough', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Millwall', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Norwich City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Preston North End', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Queens Park Rangers', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Reading', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Rotherham United', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Sheffield United', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Stoke City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Sunderland', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Swansea City', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Watford', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'West Bromwich Albion', country: 'Inglaterra' },
        { id: crypto.randomUUID(), name: 'Wigan Athletic', country: 'Inglaterra' },
        // Alemanha - Bundesliga
        { id: crypto.randomUUID(), name: 'Augsburg', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Bayer Leverkusen', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Bayern de Munique', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Bochum', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Borussia Dortmund', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Borussia Mönchengladbach', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Colônia', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Eintracht Frankfurt', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Freiburg', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Heidenheim', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Hertha Berlim', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Hoffenheim', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Mainz', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'RB Leipzig', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Schalke 04', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Stuttgart', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Union Berlim', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Werder Bremen', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Wolfsburg', country: 'Alemanha' },
        // Alemanha - 2. Bundesliga
        { id: crypto.randomUUID(), name: 'FC Colônia', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'FC Kaiserslautern', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'FC Magdeburgo', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'FC Nuremberg', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Eintracht Braunschweig', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Fortuna Düsseldorf', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Hamburgo SV', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Hannover 96', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Hertha BSC', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Karlsruher SC', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'SC Paderborn 07', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'Preußen Münster', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'SSV Jahn Regensburg', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'SSV Ulm 1846', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'SV 07 Elversberg', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'SV Darmstadt 98', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'SpVgg Greuther Fürth', country: 'Alemanha' },
        { id: crypto.randomUUID(), name: 'FC Schalke 04', country: 'Alemanha' },
        // Holanda - Eredivisie
        { id: crypto.randomUUID(), name: 'AFC Ajax', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'AZ Alkmaar', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Cambuur', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Emmen', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Excelsior', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Feyenoord', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Fortuna Sittard', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Go Ahead Eagles', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Groningen', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'SC Heerenveen', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'NEC Nijmegen', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'PSV Eindhoven', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'RKC Waalwijk', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Sparta Rotterdam', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Twente', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Utrecht', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Vitesse Arnhem', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Volendam', country: 'Holanda' },
        // Holanda - Eerste Divisie
        { id: crypto.randomUUID(), name: 'ADO Den Haag', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Almere City FC', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Den Bosch', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Dordrecht', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'FC Eindhoven', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'De Graafschap', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Helmond Sport', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'MVV Maastricht', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'NAC Breda', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Roda JC Kerkrade', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Telstar', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'TOP Oss', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'VVV-Venlo', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Willem II', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Jong Ajax', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Jong AZ', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Jong FC Utrecht', country: 'Holanda' },
        { id: crypto.randomUUID(), name: 'Jong PSV', country: 'Holanda' },
        // Portugal - Primeira Divisão
        { id: crypto.randomUUID(), name: 'Benfica', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Porto', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Sporting CP', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Braga', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Vitória de Guimarães', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Gil Vicente', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Paços de Ferreira', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Santa Clara', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Estoril', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Moreirense', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Marítimo', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Nacional', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Portimonense', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Chaves', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Arouca', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Famalicão', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Belenenses', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Tondela', country: 'Portugal' },
        // Portugal - Segunda Divisão (Liga Portugal 2)
        { id: crypto.randomUUID(), name: 'Académico de Viseu', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Académica de Coimbra', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Casa Pia', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Estrela da Amadora', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Leixões', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Penafiel', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Porto B', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Varzim', country: 'Portugal' },
        { id: crypto.randomUUID(), name: 'Vilafranquense', country: 'Portugal' },
        // Bélgica - Primeira Divisão (Belgian Pro League)
        { id: crypto.randomUUID(), name: 'Club Brugge', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Anderlecht', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Standard Liège', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Genk', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Royal Antwerp', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Gent', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'OH Leuven', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Union Saint-Gilloise', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Sint-Truiden', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Cercle Brugge', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Seraing', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Mechelen', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Westerlo', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Eupen', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Charleroi', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'KV Oostende', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Beerschot', country: 'Bélgica' },
        // Bélgica - Segunda Divisão (Challenger Pro League)
        { id: crypto.randomUUID(), name: 'Deinze', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'RWDM', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Lierse Kempenzonen', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Virton', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Dender EH', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Knokke', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'La Louvière Centre', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'RFC Liège', country: 'Bélgica' },
        { id: crypto.randomUUID(), name: 'Rupel Boom FC', country: 'Bélgica' },
        // EUA - Primeira Divisão (MLS)
        { id: crypto.randomUUID(), name: 'Atlanta United', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Austin FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Charlotte FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Chicago Fire FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'FC Cincinnati', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Colorado Rapids', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Columbus Crew', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'D.C. United', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'FC Dallas', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Houston Dynamo FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Inter Miami CF', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'LA Galaxy', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Los Angeles FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Minnesota United FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Nashville SC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'New England Revolution', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'New York City FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'New York Red Bulls', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Orlando City SC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Philadelphia Union', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Portland Timbers', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Real Salt Lake', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'San Jose Earthquakes', country: 'EUA' },
        // EUA - Segunda Divisão (USL Championship)
        { id: crypto.randomUUID(), name: 'Phoenix Rising FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Sacramento Republic FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Louisville City FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Tampa Bay Rowdies', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'El Paso Locomotive FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'San Antonio FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Hartford Athletic', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Orange County SC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Indy Eleven', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'OKC Energy FC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'New Mexico United', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Charleston Battery', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Pittsburgh Riverhounds SC', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'Atlanta United 2', country: 'EUA' },
        { id: crypto.randomUUID(), name: 'LA Galaxy II', country: 'EUA' }
      ];

      const teamsWithUserId = defaultTeams.map(team => ({
        ...team,
        user_id: userId
      }));

      const { error } = await supabase
        .from("teams")
        .insert(teamsWithUserId);

      if (error) throw error;

      // Recarrega a lista de times
      await refetchTeams();
    } catch (err) {
      console.error("Erro ao inserir times padrão:", err);
      toast.error("Erro ao inserir times padrão!");
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
