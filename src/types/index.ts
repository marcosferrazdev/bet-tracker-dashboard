export type BetResult = "GREEN" | "RED" | "REEMBOLSO" | null;

export type BetType = "Pré" | "Live" | "Múltipla" | "Bingo Múltipla";

export interface Bet {
  id: string;
  date: string;
  tipster: string;
  competition: string;
  type: BetType;
  homeTeam: string;
  awayTeam: string;
  market: string;
  bookmaker: string;
  entry: string;
  odds: number;
  stake: number;
  unitValue: number;
  stakeUnits: number;
  commission?: number;
  result: BetResult;
  profitCurrency: number;
  profitUnits: number;
  userId?: string;
  comboGames?: { homeTeam: string; awayTeam: string; competition: string }[];
}

export interface DashboardStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  refundedBets: number;
  pendingBets: number;
  hitRate: number;
  profitCurrency: number;
  profitUnits: number;
  roi: number;
}

export interface DailyStats {
  date: string;
  bets: number;
  profitCurrency: number;
  profitUnits: number;
}

export interface MonthlyStats {
  month: string;
  bets: number;
  profitCurrency: number;
  profitUnits: number;
}

export interface Tipster {
  id: string;
  name: string;
  userId?: string;
}

export interface Market {
  id: string;
  name: string;
  userId?: string;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
}

export interface Team {
  id: string;
  name: string;
  country: string;
  userId?: string;
}

export interface Bookmaker {
  id: string;
  name: string;
  userId?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Tipos para sistema de assinatura
export type SubscriptionStatus = 'active' | 'canceled' | 'inactive' | 'past_due' | 'unpaid';
export type PlanType = 'free' | 'premium';

export interface UserPlan {
  id: string;
  user_id: string;
  plan_type: PlanType;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  maxBets: number | null;
  hasAI: boolean;
  hasUnlimitedBets: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxBets: 60,
    hasAI: false,
    hasUnlimitedBets: false,
  },
  premium: {
    maxBets: null, // null = ilimitado
    hasAI: true,
    hasUnlimitedBets: true,
  },
};
