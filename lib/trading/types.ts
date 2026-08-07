export type StrategyType =
  | "buy_call"
  | "sell_call"
  | "buy_put"
  | "sell_put"
  | "cash_secured_put"
  | "covered_call"
  | "bull_put_credit_spread"
  | "bear_call_credit_spread"
  | "bull_call_debit_spread"
  | "bear_put_debit_spread"
  | "iron_condor"
  | "directional_call"
  | "directional_put";

export type ContractType = "call" | "put";

export interface UniverseSymbol {
  symbol: string;
  companyName: string;
  sector: string;
}

export interface Quote {
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  vwap?: number;
  marketCap?: number;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionContract {
  symbol: string;
  underlyingSymbol: string;
  expirationDate: string;
  strike: number;
  type: ContractType;
  bid: number;
  ask: number;
  last?: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionsChain {
  underlyingSymbol: string;
  capturedAt: string;
  contracts: OptionContract[];
}

export interface EarningsEvent {
  symbol: string;
  date: string | null;
  confirmed: boolean;
}

export interface MarketRegime {
  label: "risk_on" | "neutral" | "risk_off" | "high_volatility";
  spyTrend: number;
  qqqTrend: number;
  vixLevel: number;
  breadth: number;
  score: number;
  notes: string[];
}

export interface TechnicalSnapshot {
  symbol: string;
  price: number;
  rsi14: number;
  macdHistogram: number;
  atr14: number;
  atrPercent: number;
  sma20: number;
  sma50: number;
  sma200: number;
  trendScore: number;
  momentumScore: number;
  vwapPosition: "above" | "near" | "below";
}

export interface OptionLeg {
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
}

export interface TradePlan {
  entry: string;
  exit: string;
  stopLoss: string;
  profitTarget: string;
  timeStop: string;
}

export interface Recommendation {
  id?: string;
  rank: number;
  symbol: string;
  companyName: string;
  sector: string;
  strategyType: StrategyType;
  strategyName: string;
  entryRecommendation: string;
  exitRecommendation: string;
  strikePrice: number;
  expirationDate: string;
  probabilityOfProfit: number;
  expectedMove: number;
  maxRisk: number;
  maxReward: number;
  riskRewardRatio: number;
  confidenceScore: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  ivPercentile: number;
  liquidityScore: number;
  technicalScore: number;
  historicalWinRate: number;
  suggestedPositionSizePct: number;
  optionLegs: OptionLeg[];
  tradePlan: TradePlan;
  rationale: string[];
  warnings: string[];
  createdAt: string;
  expiresAt: string;
}

export interface StrategyContext {
  symbol: UniverseSymbol;
  quote: Quote;
  chain: OptionsChain;
  technicals: TechnicalSnapshot;
  regime: MarketRegime;
  earnings: EarningsEvent;
  historicalWinRate: number;
  ivPercentile: number;
  rankAllEligibleContracts?: boolean;
}

export interface StrategyModule {
  type: StrategyType;
  name: string;
  enabledByDefault: boolean;
  evaluate(context: StrategyContext): Recommendation | null;
}

export interface ScanResult {
  scanId?: string;
  scanDate: string;
  startedAt: string;
  completedAt: string;
  marketRegime: MarketRegime;
  universeCount: number;
  analyzedCount: number;
  skippedCount: number;
  recommendations: Recommendation[];
  warnings: string[];
}

export interface BacktestTrade {
  symbol: string;
  strategyType: StrategyType;
  openedAt: string;
  closedAt: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  winner: boolean;
}

export interface BacktestMetrics {
  trades: number;
  winRate: number;
  averageReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  expectancy: number;
  tradesSample: BacktestTrade[];
}

export interface MarketDataProvider {
  name: string;
  getQuote(symbol: string): Promise<Quote>;
  getCandles(symbol: string, lookbackDays: number): Promise<Candle[]>;
  getOptionsChain(symbol: string): Promise<OptionsChain>;
  getEarningsDate(symbol: string): Promise<EarningsEvent>;
  getVixLevel(): Promise<number>;
  getMarketBreadth(symbols: string[]): Promise<number>;
}
