import { describe, expect, it } from "vitest";
import { runLightweightBacktest } from "@/lib/trading/backtester";

describe("lightweight backtester", () => {
  it("calculates core strategy metrics", () => {
    const metrics = runLightweightBacktest({
      strategyType: "bull_put_credit_spread",
      symbol: "QQQ"
    });

    expect(metrics.trades).toBeGreaterThan(10);
    expect(metrics.winRate).toBeGreaterThan(40);
    expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(metrics.profitFactor).toBeGreaterThan(0);
    expect(metrics.tradesSample.length).toBeGreaterThan(0);
    expect(metrics.tradeHistory).toHaveLength(metrics.trades);
    expect(metrics.wins + metrics.losses).toBe(metrics.trades);
    expect(metrics.tradeHistory.filter((trade) => trade.winner)).toHaveLength(metrics.wins);
    expect(metrics.tradeHistory.filter((trade) => !trade.winner)).toHaveLength(metrics.losses);
    expect(metrics.tradeHistory.every((trade) => trade.outcomeReason.length > 20)).toBe(true);
  });

  it("reconciles the trade ledger with profit factor and expectancy", () => {
    const metrics = runLightweightBacktest({
      strategyType: "cash_secured_put",
      symbol: "CRWD",
      startDate: "2025-01-01",
      endDate: "2025-12-31"
    });

    const ledgerPnl = metrics.tradeHistory.reduce((total, trade) => total + trade.pnl, 0);

    expect(metrics.expectancy).toBeCloseTo(ledgerPnl / metrics.trades, 2);
    expect(metrics.profitFactor).toBeCloseTo(metrics.grossProfit / metrics.grossLoss, 2);
    expect(metrics.tradeHistory.every((trade) => trade.equityAfter > 0)).toBe(true);
  });

  it("varies win rates by symbol for the same strategy window", () => {
    const rates = ["AAPL", "MSFT", "NVDA", "TSLA", "ADBE", "QQQ"].map((symbol) =>
      runLightweightBacktest({
        strategyType: "buy_call",
        symbol,
        startDate: "2025-01-01",
        endDate: "2025-12-31"
      }).winRate
    );

    expect(new Set(rates).size).toBeGreaterThan(1);
  });
});
