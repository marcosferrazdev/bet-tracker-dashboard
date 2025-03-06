
export type BetResult = "GREEN" | "RED" | "REEMBOLSO" | null;

export type BetType = "PRÉ" | "LIVE" | "COMBO" | "OUTROS";

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
