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
});
