import type { StrategyType } from "@/lib/trading/types";

export const BASIC_STRATEGIES: StrategyType[] = [
  "buy_call",
  "sell_call",
  "buy_put",
  "sell_put"
];

export const ADVANCED_STRATEGIES: StrategyType[] = [
  "bull_put_credit_spread",
  "bear_call_credit_spread",
  "bull_call_debit_spread",
  "bear_put_debit_spread",
  "iron_condor"
];

export function getStrategyCategory(strategyType: StrategyType) {
  return BASIC_STRATEGIES.includes(strategyType) ? "basic" : "advanced";
}
