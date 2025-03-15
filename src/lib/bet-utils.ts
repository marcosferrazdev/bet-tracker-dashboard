
import { Bet, BetResult, DailyStats, DashboardStats, MonthlyStats } from "@/types";
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Calculate units based on currency and unit value
export const calculateUnits = (currencyValue: number, unitValue: number): number => {
  if (!unitValue || unitValue === 0) return 0;
  return Number((currencyValue / unitValue).toFixed(2));
};

// Calculate profit based on stake, odds, and result
export const calculateProfit = (stake: number, odds: number, result: BetResult): number => {
  if (result === "GREEN") {
    return Number(((stake * odds) - stake).toFixed(2));
  } else if (result === "RED") {
    return -stake;
  } else if (result === "REEMBOLSO") {
    return 0;
  }
  return 0;
};

// Format currency value to BRL
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Calculate dashboard stats from bets
export const calculateDashboardStats = (bets: Bet[]): DashboardStats => {
  const totalBets = bets.length;
  const wonBets = bets.filter(bet => bet.result === "GREEN").length;
  const lostBets = bets.filter(bet => bet.result === "RED").length;
  const refundedBets = bets.filter(bet => bet.result === "REEMBOLSO").length;
  const pendingBets = bets.filter(bet => bet.result === null).length;
  
  const hitRate = totalBets > 0 ? (wonBets / (totalBets - refundedBets - pendingBets)) * 100 : 0;
  
  const profitCurrency = bets.reduce((sum, bet) => sum + (bet.profitCurrency || 0), 0);
  const profitUnits = bets.reduce((sum, bet) => sum + (bet.profitUnits || 0), 0);
  
  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const roi = totalStake > 0 ? (profitCurrency / totalStake) * 100 : 0;
  
  return {
    totalBets,
    wonBets,
    lostBets,
    refundedBets,
    pendingBets,
    hitRate: Number(hitRate.toFixed(2)),
    profitCurrency,
    profitUnits,
    roi: Number(roi.toFixed(2))
  };
};

// Group bets by day and calculate daily stats
export const calculateDailyStats = (bets: Bet[]): DailyStats[] => {
  const dailyMap = new Map<string, DailyStats>();
  
  bets.forEach(bet => {
    const dateKey = bet.date;
    const existing = dailyMap.get(dateKey) || { 
      date: dateKey, 
      bets: 0, 
      profitCurrency: 0, 
      profitUnits: 0 
    };
    
    dailyMap.set(dateKey, {
      ...existing,
      bets: existing.bets + 1,
      profitCurrency: existing.profitCurrency + (bet.profitCurrency || 0),
      profitUnits: existing.profitUnits + (bet.profitUnits || 0)
    });
  });
  
  // Convert to array and sort by date
  return Array.from(dailyMap.values())
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
};

// Group bets by month and calculate monthly stats
export const calculateMonthlyStats = (bets: Bet[]): MonthlyStats[] => {
  const monthlyMap = new Map<string, MonthlyStats>();
  
  bets.forEach(bet => {
    const date = parseISO(bet.date);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
    
    const existing = monthlyMap.get(monthKey) || { 
      month: monthLabel, 
      bets: 0, 
      profitCurrency: 0, 
      profitUnits: 0 
    };
    
    monthlyMap.set(monthKey, {
      ...existing,
      bets: existing.bets + 1,
      profitCurrency: existing.profitCurrency + (bet.profitCurrency || 0),
      profitUnits: existing.profitUnits + (bet.profitUnits || 0)
    });
  });
  
  // Convert to array and sort by month
  return Array.from(monthlyMap.values())
    .sort((a, b) => {
      const monthA = a.month.split(' ');
      const monthB = b.month.split(' ');
      
      if (monthA[1] !== monthB[1]) {
        return parseInt(monthA[1]) - parseInt(monthB[1]);
      }
      
      return a.month.localeCompare(b.month, 'pt-BR');
    });
};

// Get current month's range
export const getCurrentMonthRange = () => {
  const today = new Date();
  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
  };
};

// Fill in missing days in the current month with zero values
export const fillMissingDays = (dailyStats: DailyStats[]): DailyStats[] => {
  const { start, end } = getCurrentMonthRange();
  
  const allDays = eachDayOfInterval({ start, end });
  const existingDaysMap = new Map(dailyStats.map(stat => [stat.date, stat]));
  
  return allDays.map(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return existingDaysMap.get(dateKey) || {
      date: dateKey,
      bets: 0,
      profitCurrency: 0,
      profitUnits: 0
    };
  });
};

// Format date in Brazilian format
export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);
  const hasTime = dateString.includes("T") && !dateString.endsWith("T00:00:00");

  if (hasTime) {
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  }
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

// Format result class for styling
export const getResultClass = (result: BetResult): string => {
  switch (result) {
    case "GREEN":
      return "text-success-600 font-medium";
    case "RED":
      return "text-danger-600 font-medium";
    case "REEMBOLSO":
      return "text-neutral-500 font-medium";
    default:
      return "text-neutral-400";
  }
};

// Format result background class for styling
export const getResultBgClass = (result: BetResult): string => {
  switch (result) {
    case "GREEN":
      return "bg-success-500";
    case "RED":
      return "bg-danger-500";
    case "REEMBOLSO":
      return "bg-neutral-500";
    default:
      return "bg-neutral-300";
  }
};

export function getProfitColorClass(result: BetResult) {
  switch (result) {
    case "GREEN":
      return "text-green-600 font-medium";
    case "RED":
      return "text-red-600 font-medium";
    case "REEMBOLSO":
      return "text-neutral-500 font-medium";
    default:
      return "text-neutral-600";
  }
}

