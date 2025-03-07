export type BetResult = "GREEN" | "RED" | "REEMBOLSO" | null;

export type BetType = "Pré" | "Live" | "Múltipla" | "Outros";

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
}

export interface Market {
  id: string;
  name: string;
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
}

export interface Bookmaker {
  id: string;
  name: string;
  isLicensed: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}
