
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bet, DashboardStats, DailyStats, MonthlyStats } from '@/types';
import { calculateDashboardStats, calculateDailyStats, calculateMonthlyStats, fillMissingDays } from '@/lib/bet-utils';
import { toast } from 'sonner';

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

  useEffect(() => {
    // Load data from localStorage
    const loadBets = () => {
      try {
        const savedBets = localStorage.getItem('bets');
        const savedUnitValue = localStorage.getItem('unitValue');
        
        if (savedBets) {
          setBets(JSON.parse(savedBets));
        }
        
        if (savedUnitValue) {
          setUnitValue(parseFloat(savedUnitValue));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados!');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBets();
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
      setUnitValue
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
