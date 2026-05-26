import { describe, expect, it } from "vitest";
import { DemoMarketDataProvider } from "@/lib/trading/market-data";
import { getStrategyCategory } from "@/lib/trading/strategy-categories";
import { runDailyOptionsScan } from "@/lib/trading/scanner";

describe("daily options scanner", () => {
  it("produces ranked, risk-bounded recommendations", async () => {
    const scan = await runDailyOptionsScan({
      maxRecommendations: 5,
      provider: new DemoMarketDataProvider()
    });

    expect(scan.universeCount).toBeGreaterThan(50);
    expect(scan.recommendations.length).toBeGreaterThan(0);
    expect(scan.recommendations.length).toBeLessThanOrEqual(10);
    expect(
      scan.recommendations.some(
        (recommendation) => getStrategyCategory(recommendation.strategyType) === "basic"
      )
    ).toBe(true);
    expect(scan.recommendations[0].rank).toBe(1);
    expect(scan.recommendations[0].probabilityOfProfit).toBeGreaterThan(45);
    expect(scan.recommendations[0].maxRisk).toBeGreaterThan(0);
    expect(scan.recommendations[0].optionLegs.length).toBeGreaterThan(0);
  });
});
