export const PAPER_ACCOUNT_SLUG = "figure-my-money-default";
export const PAPER_STRATEGY_VERSION = "income-v2-theta-2026-08";

export const PAPER_RULES = {
  startingCash: 25_000,
  maxPositionEquityPct: 0.4,
  maxDeployedEquityPct: 0.8,
  maxOpenPositions: 3,
  contractsPerPosition: 1,
  profitTargetPct: 0.5,
  stopMultiple: 2,
  maxPositionLossPct: 0.08,
  timeExitDte: 7,
  earningsExitDays: 3,
  optionSpreadSlippagePct: 0.25,
  underlyingSlippageBps: 5,
  optionFeePerContract: 0.65,
  assignmentEnabled: false
} as const;

export const PAPER_STRATEGY_PARAMETERS = {
  max_position_equity_pct: PAPER_RULES.maxPositionEquityPct,
  max_deployed_equity_pct: PAPER_RULES.maxDeployedEquityPct,
  max_open_positions: PAPER_RULES.maxOpenPositions,
  contracts_per_position: PAPER_RULES.contractsPerPosition,
  profit_target_pct: PAPER_RULES.profitTargetPct,
  stop_multiple: PAPER_RULES.stopMultiple,
  max_position_loss_pct: PAPER_RULES.maxPositionLossPct,
  time_exit_dte: PAPER_RULES.timeExitDte,
  earnings_exit_days: PAPER_RULES.earningsExitDays,
  monitor_interval_minutes: 15,
  option_spread_slippage_pct: PAPER_RULES.optionSpreadSlippagePct,
  underlying_slippage_bps: PAPER_RULES.underlyingSlippageBps,
  option_fee_per_contract: PAPER_RULES.optionFeePerContract,
  assignment_enabled: PAPER_RULES.assignmentEnabled
};
