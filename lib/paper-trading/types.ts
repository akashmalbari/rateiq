import type { ContractType, StrategyType } from "@/lib/trading/types";

export type PaperStrategyType = Extract<StrategyType, "cash_secured_put" | "covered_call">;

export interface PaperAccount {
  id: string;
  slug: string;
  name: string;
  starting_cash: number | string;
  cash_balance: number | string;
  status: "active" | "paused" | "completed";
  strategy_version: string;
  strategy_parameters: Record<string, unknown>;
  started_at: string;
}

export interface PaperRecommendationRow {
  id: string;
  symbol: string;
  strategy_type: PaperStrategyType;
  confidence_score: number;
  probability_of_profit: number | string;
  option_legs: Array<{
    action: "buy" | "sell";
    type: ContractType;
    strike: number;
    expirationDate: string;
    bid: number;
    ask: number;
    mid: number;
    delta: number;
    gamma: number;
    theta: number;
    impliedVolatility: number;
  }>;
  warnings: string[];
  created_at: string;
}

export interface PaperPosition {
  id: string;
  account_id: string;
  recommendation_id: string | null;
  open_order_id: string | null;
  symbol: string;
  strategy_type: PaperStrategyType;
  option_type: ContractType;
  option_quantity: -1;
  underlying_quantity: 0 | 100;
  strike: number | string;
  expiration_date: string;
  entry_option_price: number | string;
  current_option_price: number | string;
  entry_underlying_price: number | string;
  current_underlying_price: number | string;
  entry_greeks: Record<string, number>;
  current_greeks: Record<string, number>;
  collateral_reserved: number | string;
  capital_deployed: number | string;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  realized_pnl: number | string | null;
  close_reason: string | null;
  strategy_version: string;
}

export interface PaperPortfolioValues {
  cashBalance: number;
  availableCash: number;
  reservedCollateral: number;
  stockMarketValue: number;
  optionLiability: number;
  equity: number;
  deployedCapital: number;
  unrealizedPnl: number;
}

export interface PaperCycleResult {
  skipped: boolean;
  reason?: string;
  opened?: number;
  marked?: number;
  closed?: number;
  errors?: string[];
}
