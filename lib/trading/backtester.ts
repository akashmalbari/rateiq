import { subDays, formatISO } from "date-fns";
import { clamp, formatCurrency } from "@/lib/utils";
import type { BacktestMetrics, BacktestTrade, StrategyType } from "@/lib/trading/types";

interface BacktestOptions {
  strategyType: StrategyType;
  symbol?: string;
  startDate?: string;
  endDate?: string;
  startingEquity?: number;
}

interface SymbolTraits {
  trendBias: number;
  volatility: number;
  liquidity: number;
  meanReversion: number;
}

const bullishStrategies = new Set<StrategyType>([
  "buy_call",
  "sell_put",
  "cash_secured_put",
  "bull_put_credit_spread",
  "bull_call_debit_spread",
  "directional_call"
]);

const bearishStrategies = new Set<StrategyType>([
  "buy_put",
  "sell_call",
  "bear_call_credit_spread",
  "bear_put_debit_spread",
  "directional_put"
]);

function seededUnit(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash % 10_000) / 10_000;
}

function strategyProfile(strategyType: StrategyType) {
  const profiles: Record<StrategyType, { winRate: number; avgWin: number; avgLoss: number }> = {
    cash_secured_put: { winRate: 0.69, avgWin: 0.018, avgLoss: -0.035 },
    covered_call: { winRate: 0.64, avgWin: 0.014, avgLoss: -0.028 },
    buy_call: { winRate: 0.53, avgWin: 0.068, avgLoss: -0.04 },
    sell_call: { winRate: 0.64, avgWin: 0.014, avgLoss: -0.03 },
    buy_put: { winRate: 0.52, avgWin: 0.064, avgLoss: -0.041 },
    sell_put: { winRate: 0.68, avgWin: 0.018, avgLoss: -0.035 },
    bull_put_credit_spread: { winRate: 0.67, avgWin: 0.021, avgLoss: -0.033 },
    bear_call_credit_spread: { winRate: 0.64, avgWin: 0.02, avgLoss: -0.035 },
    bull_call_debit_spread: { winRate: 0.54, avgWin: 0.056, avgLoss: -0.034 },
    bear_put_debit_spread: { winRate: 0.53, avgWin: 0.052, avgLoss: -0.036 },
    iron_condor: { winRate: 0.62, avgWin: 0.018, avgLoss: -0.031 },
    directional_call: { winRate: 0.5, avgWin: 0.074, avgLoss: -0.042 },
    directional_put: { winRate: 0.49, avgWin: 0.07, avgLoss: -0.044 }
  };
  return profiles[strategyType];
}

function symbolTraits(symbol: string): SymbolTraits {
  const normalized = symbol.toUpperCase();
  return {
    trendBias: seededUnit(`${normalized}:trend-bias`) * 2 - 1,
    volatility: seededUnit(`${normalized}:realized-volatility`),
    liquidity: seededUnit(`${normalized}:liquidity-profile`),
    meanReversion: seededUnit(`${normalized}:mean-reversion`) * 2 - 1
  };
}

function strategySymbolAdjustment(strategyType: StrategyType, traits: SymbolTraits) {
  const liquidityEdge = (traits.liquidity - 0.5) * 0.045;
  const volatilityPenalty = (traits.volatility - 0.5) * -0.035;

  if (strategyType === "iron_condor") {
    const rangeBoundEdge = (0.5 - Math.abs(traits.trendBias)) * 0.12;
    const calmVolEdge = (0.5 - traits.volatility) * 0.055;
    return rangeBoundEdge + calmVolEdge + liquidityEdge;
  }

  if (strategyType === "covered_call") {
    const mildTrendEdge = (0.55 - Math.abs(traits.trendBias - 0.25)) * 0.06;
    return mildTrendEdge + liquidityEdge + volatilityPenalty;
  }

  if (bullishStrategies.has(strategyType)) {
    return traits.trendBias * 0.07 + traits.meanReversion * 0.02 + liquidityEdge + volatilityPenalty;
  }

  if (bearishStrategies.has(strategyType)) {
    return traits.trendBias * -0.07 + traits.meanReversion * -0.015 + liquidityEdge + volatilityPenalty;
  }

  return liquidityEdge + volatilityPenalty;
}

function outcomeReason(strategyType: StrategyType, winner: boolean, traits: SymbolTraits) {
  if (winner) {
    switch (strategyType) {
      case "cash_secured_put":
      case "sell_put":
        return "The modeled price stayed above the short-put risk zone while time decay reduced the option premium.";
      case "covered_call":
        return "The underlying held its value and the short-call premium decayed through the modeled exit.";
      case "sell_call":
        return "The modeled upside stayed contained, allowing the short-call premium to decay.";
      case "buy_call":
      case "directional_call":
        return "Bullish momentum developed quickly enough to overcome premium decay.";
      case "buy_put":
      case "directional_put":
        return "Bearish momentum developed quickly enough to overcome premium decay.";
      case "bull_put_credit_spread":
        return "The underlying remained above the short strike and the credit spread moved toward its profit target.";
      case "bear_call_credit_spread":
        return "The underlying remained below the short strike and the credit spread moved toward its profit target.";
      case "bull_call_debit_spread":
        return "The bullish move was large enough to expand the debit spread before time decay became dominant.";
      case "bear_put_debit_spread":
        return "The bearish move was large enough to expand the debit spread before time decay became dominant.";
      case "iron_condor":
        return "The modeled price stayed inside the expected range while both short-option premiums decayed.";
    }
  }

  switch (strategyType) {
    case "cash_secured_put":
    case "sell_put":
      return traits.volatility > 0.55
        ? "A downside move and volatility expansion overwhelmed the premium collected on the short put."
        : "The modeled price fell through the short-put cushion before enough time decay was captured.";
    case "covered_call":
      return "The underlying decline was larger than the call premium collected, producing a net loss on the buy-write.";
    case "sell_call":
      return "Upside momentum moved through the short-call risk zone faster than premium could decay.";
    case "buy_call":
    case "directional_call":
      return "The bullish move was too small or too late to offset the option premium and time decay.";
    case "buy_put":
    case "directional_put":
      return "The bearish move was too small or too late to offset the option premium and time decay.";
    case "bull_put_credit_spread":
      return "The modeled price breached the spread's short put, and the loss exceeded the opening credit.";
    case "bear_call_credit_spread":
      return "The modeled price breached the spread's short call, and the loss exceeded the opening credit.";
    case "bull_call_debit_spread":
      return "Bullish follow-through failed, so time decay reduced the debit spread before the exit.";
    case "bear_put_debit_spread":
      return "Bearish follow-through failed, so time decay reduced the debit spread before the exit.";
    case "iron_condor":
      return "The modeled move escaped the expected range, expanding one side faster than the collected credit decayed.";
  }
}

function simulatedExitPrice(
  strategyType: StrategyType,
  winner: boolean,
  entryPrice: number,
  seed: number
) {
  const move = 0.015 + seed * 0.075;
  let direction = seed >= 0.5 ? 1 : -1;
  let appliedMove = move;

  if (strategyType === "iron_condor") {
    appliedMove = winner ? move * 0.2 : move;
  } else if (strategyType === "covered_call") {
    direction = winner ? 1 : -1;
    appliedMove = winner ? move * 0.35 : move;
  } else if (bullishStrategies.has(strategyType)) {
    direction = winner ? 1 : -1;
  } else if (bearishStrategies.has(strategyType)) {
    direction = winner ? -1 : 1;
  }

  return Number((entryPrice * (1 + direction * appliedMove)).toFixed(2));
}

function maxDrawdown(equityCurve: number[]) {
  let peak = equityCurve[0] ?? 0;
  let drawdown = 0;
  for (const equity of equityCurve) {
    peak = Math.max(peak, equity);
    drawdown = Math.min(drawdown, (equity - peak) / peak);
  }
  return Math.abs(drawdown);
}

export function runLightweightBacktest(options: BacktestOptions): BacktestMetrics {
  const symbol = options.symbol ?? "QQQ";
  const endDate = options.endDate ?? formatISO(new Date(), { representation: "date" });
  const startDate = options.startDate ?? formatISO(subDays(new Date(), 365), { representation: "date" });
  const startingEquity = options.startingEquity ?? 100_000;
  const profile = strategyProfile(options.strategyType);
  const traits = symbolTraits(symbol);
  const symbolAdjustment = strategySymbolAdjustment(options.strategyType, traits);
  const days = Math.max(
    45,
    Math.round((new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86_400_000)
  );
  const tradeCount = Math.max(12, Math.floor(days / 12));
  const trades: BacktestTrade[] = [];
  const returns: number[] = [];
  const equityCurve = [startingEquity];
  let equity = startingEquity;
  let grossProfit = 0;
  let grossLoss = 0;

  for (let index = 0; index < tradeCount; index += 1) {
    const opened = subDays(new Date(`${endDate}T00:00:00Z`), (tradeCount - index) * 12);
    const closed = subDays(opened, -8);
    const openedAt = formatISO(opened, { representation: "date" });
    const outcomeSeed = seededUnit(`${symbol}:${options.strategyType}:${openedAt}:outcome`);
    const marketWindowNoise = (seededUnit(`${options.strategyType}:${openedAt}:market-window`) - 0.5) * 0.08;
    const threshold = clamp(profile.winRate + symbolAdjustment + marketWindowNoise, 0.32, 0.84);
    const winner = outcomeSeed <= threshold;
    const volatilityMultiplier = 0.82 + traits.volatility * 0.5;
    const liquidityMultiplier = 0.92 + traits.liquidity * 0.16;
    const magnitude = winner
      ? profile.avgWin * (0.65 + seededUnit(`${symbol}:win:${index}`) * 1.35) * liquidityMultiplier
      : profile.avgLoss * (0.7 + seededUnit(`${symbol}:loss:${index}`) * 1.2) * volatilityMultiplier;
    const equityBefore = equity;
    const pnl = equityBefore * clamp(magnitude, -0.075, 0.09);
    equity += pnl;
    equityCurve.push(equity);
    returns.push(pnl / Math.max(equity - pnl, 1));
    if (pnl >= 0) grossProfit += pnl;
    else grossLoss += Math.abs(pnl);
    const entryPrice = Number((100 + seededUnit(`${symbol}:entry:${index}`) * 80).toFixed(2));
    trades.push({
      symbol,
      strategyType: options.strategyType,
      openedAt,
      closedAt: formatISO(closed, { representation: "date" }),
      entryPrice,
      exitPrice: simulatedExitPrice(
        options.strategyType,
        winner,
        entryPrice,
        seededUnit(`${symbol}:exit:${index}`)
      ),
      equityBefore: Number(equityBefore.toFixed(2)),
      equityAfter: Number(equity.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPct: Number((magnitude * 100).toFixed(2)),
      winner,
      outcomeReason: outcomeReason(options.strategyType, winner, traits)
    });
  }

  const avgReturn = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const returnStd = Math.sqrt(
    returns.reduce((sum, value) => sum + (value - avgReturn) ** 2, 0) / returns.length
  );
  const wins = trades.filter((trade) => trade.winner).length;

  return {
    trades: tradeCount,
    wins,
    losses: tradeCount - wins,
    winRate: Number(((wins / tradeCount) * 100).toFixed(1)),
    averageReturn: Number((avgReturn * 100).toFixed(2)),
    sharpeRatio: Number((returnStd ? (avgReturn / returnStd) * Math.sqrt(21) : 0).toFixed(2)),
    maxDrawdown: Number((maxDrawdown(equityCurve) * 100).toFixed(2)),
    profitFactor: Number((grossProfit / Math.max(grossLoss, 1)).toFixed(2)),
    expectancy: Number(
      (trades.reduce((sum, trade) => sum + trade.pnl, 0) / tradeCount).toFixed(2)
    ),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    tradeHistory: trades,
    tradesSample: trades.slice(-12).map((trade) => ({
      ...trade,
      pnl: Number(trade.pnl.toFixed(2))
    }))
  };
}

export function summarizeBacktest(metrics: BacktestMetrics) {
  return `${metrics.trades} trades, ${metrics.winRate}% win rate, ${metrics.sharpeRatio} Sharpe, ${metrics.maxDrawdown}% max drawdown, ${metrics.profitFactor} profit factor, ${formatCurrency(metrics.expectancy)} average expectancy.`;
}
