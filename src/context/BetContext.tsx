
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bet, DashboardStats, DailyStats, MonthlyStats, Tipster, Market, Competition, Team, Bookmaker } from '@/types';
import { calculateDashboardStats, calculateDailyStats, calculateMonthlyStats, fillMissingDays } from '@/lib/bet-utils';
import { toast } from 'sonner';
import { brazilianBookmakers } from '@/data/bookmakers';
import { competitions } from '@/data/competitions';
import { teams } from '@/data/teams';

interface BetContextType {
  bets: Bet[];
  addBet: (bet: Bet) => void;
  updateBet: (bet: Bet) => void;
  deleteBet: (id: string) => void;
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

export const BetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    roi: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unitValue, setUnitValue] = useState<number>(10); // Default unit value is R$10
  
  // New entities state
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>(brazilianBookmakers);
  
  // Use predefined data for competitions and teams
  const [competitionsList] = useState<Competition[]>(competitions);
  const [teamsList] = useState<Team[]>(teams);

  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      try {
        const savedBets = localStorage.getItem('bets');
        const savedUnitValue = localStorage.getItem('unitValue');
        const savedTipsters = localStorage.getItem('tipsters');
        const savedMarkets = localStorage.getItem('markets');
        
        if (savedBets) {
          setBets(JSON.parse(savedBets));
        }
        
        if (savedUnitValue) {
          setUnitValue(parseFloat(savedUnitValue));
        }
        
        if (savedTipsters) {
          setTipsters(JSON.parse(savedTipsters));
        }
        
        if (savedMarkets) {
          setMarkets(JSON.parse(savedMarkets));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados!');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    // Update stats when bets change
    if (!isLoading) {
      const newStats = calculateDashboardStats(bets);
      const newDailyStats = fillMissingDays(calculateDailyStats(bets));
      const newMonthlyStats = calculateMonthlyStats(bets);
      
      setStats(newStats);
      setDailyStats(newDailyStats);
      setMonthlyStats(newMonthlyStats);
      
      // Save to localStorage
      localStorage.setItem('bets', JSON.stringify(bets));
    }
  }, [bets, isLoading]);

  useEffect(() => {
    // Save unit value to localStorage when it changes
    if (!isLoading) {
      localStorage.setItem('unitValue', unitValue.toString());
    }
  }, [unitValue, isLoading]);
  
  useEffect(() => {
    // Save tipsters to localStorage when they change
    if (!isLoading) {
      localStorage.setItem('tipsters', JSON.stringify(tipsters));
    }
  }, [tipsters, isLoading]);
  
  useEffect(() => {
    // Save markets to localStorage when they change
    if (!isLoading) {
      localStorage.setItem('markets', JSON.stringify(markets));
    }
  }, [markets, isLoading]);

  const addBet = (bet: Bet) => {
    setBets(prevBets => [...prevBets, bet]);
    toast.success('Aposta adicionada com sucesso!');
  };

  const updateBet = (updatedBet: Bet) => {
    setBets(prevBets => 
      prevBets.map(bet => bet.id === updatedBet.id ? updatedBet : bet)
    );
    toast.success('Aposta atualizada com sucesso!');
  };

  const deleteBet = (id: string) => {
    setBets(prevBets => prevBets.filter(bet => bet.id !== id));
    toast.success('Aposta removida com sucesso!');
  };
  
  // Tipster management
  const addTipster = (tipster: Tipster) => {
    setTipsters(prev => [...prev, tipster]);
    toast.success('Tipster adicionado com sucesso!');
  };
  
  const updateTipster = (updatedTipster: Tipster) => {
    setTipsters(prev => 
      prev.map(tipster => tipster.id === updatedTipster.id ? updatedTipster : tipster)
    );
    toast.success('Tipster atualizado com sucesso!');
  };
  
  const deleteTipster = (id: string) => {
    setTipsters(prev => prev.filter(tipster => tipster.id !== id));
    toast.success('Tipster removido com sucesso!');
  };
  
  // Market management
  const addMarket = (market: Market) => {
    setMarkets(prev => [...prev, market]);
    toast.success('Mercado adicionado com sucesso!');
  };
  
  const updateMarket = (updatedMarket: Market) => {
    setMarkets(prev => 
      prev.map(market => market.id === updatedMarket.id ? updatedMarket : market)
    );
    toast.success('Mercado atualizado com sucesso!');
  };
  
  const deleteMarket = (id: string) => {
    setMarkets(prev => prev.filter(market => market.id !== id));
    toast.success('Mercado removido com sucesso!');
  };

  return (
    <BetContext.Provider value={{
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
      teams: teamsList
    }}>
      {children}
    </BetContext.Provider>
  );
};

export const useBets = () => {
  const context = useContext(BetContext);
  if (context === undefined) {
    throw new Error('useBets must be used within a BetProvider');
  }
  return context;
};
