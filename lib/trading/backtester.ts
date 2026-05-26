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
    const cycle = ((index * 37) % 100) / 100;
    const winner = cycle <= profile.winRate;
    const magnitude = winner
      ? profile.avgWin * (0.65 + seededUnit(`${symbol}:win:${index}`) * 1.35)
      : profile.avgLoss * (0.7 + seededUnit(`${symbol}:loss:${index}`) * 1.2);
    const pnl = equity * clamp(magnitude, -0.075, 0.09);
    equity += pnl;
    equityCurve.push(equity);
    returns.push(pnl / Math.max(equity - pnl, 1));
    if (pnl >= 0) grossProfit += pnl;
    else grossLoss += Math.abs(pnl);
    trades.push({
      symbol,
      strategyType: options.strategyType,
      openedAt: formatISO(opened, { representation: "date" }),
      closedAt: formatISO(closed, { representation: "date" }),
      entryPrice: Number((100 + seededUnit(`${symbol}:entry:${index}`) * 80).toFixed(2)),
      exitPrice: Number((100 + seededUnit(`${symbol}:exit:${index}`) * 80).toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPct: Number((magnitude * 100).toFixed(2)),
      winner
    });
  }

  const avgReturn = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const returnStd = Math.sqrt(
    returns.reduce((sum, value) => sum + (value - avgReturn) ** 2, 0) / returns.length
  );
  const wins = trades.filter((trade) => trade.winner).length;

  return {
    trades: tradeCount,
    winRate: Number(((wins / tradeCount) * 100).toFixed(1)),
    averageReturn: Number((avgReturn * 100).toFixed(2)),
    sharpeRatio: Number((returnStd ? (avgReturn / returnStd) * Math.sqrt(21) : 0).toFixed(2)),
    maxDrawdown: Number((maxDrawdown(equityCurve) * 100).toFixed(2)),
    profitFactor: Number((grossProfit / Math.max(grossLoss, 1)).toFixed(2)),
    expectancy: Number(
      (trades.reduce((sum, trade) => sum + trade.pnl, 0) / tradeCount).toFixed(2)
    ),
    tradesSample: trades.slice(-12).map((trade) => ({
      ...trade,
      pnl: Number(trade.pnl.toFixed(2))
    }))
  };
}

export function summarizeBacktest(metrics: BacktestMetrics) {
  return `${metrics.trades} trades, ${metrics.winRate}% win rate, ${metrics.sharpeRatio} Sharpe, ${metrics.maxDrawdown}% max drawdown, ${metrics.profitFactor} profit factor, ${formatCurrency(metrics.expectancy)} average expectancy.`;
}
