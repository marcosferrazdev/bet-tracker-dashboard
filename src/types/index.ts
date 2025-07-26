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
  comboGames?: { homeTeam: string; awayTeam: string; competition: string; entry: string }[];
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

export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing';
export type PlanType = 'free' | 'premium';

export interface UserPlan {
  id: string;
  user_id: string;
  plan_type: PlanType;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: SubscriptionStatus;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  plan_id: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  maxBets: number | null; // null = unlimited
  hasAIAnalysis: boolean;
  hasCalculator: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxBets: 60,
    hasAIAnalysis: false,
    hasCalculator: true,
  },
  premium: {
    maxBets: null, // unlimited
    hasAIAnalysis: true,
    hasCalculator: true,
  },
};
