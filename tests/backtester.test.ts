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
