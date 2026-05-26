import { describe, expect, it } from "vitest";
import { DemoMarketDataProvider } from "@/lib/trading/market-data";
import { runDailyOptionsScan } from "@/lib/trading/scanner";

describe("daily options scanner", () => {
  it("produces ranked, risk-bounded recommendations", async () => {
    const scan = await runDailyOptionsScan({
      maxRecommendations: 5,
      provider: new DemoMarketDataProvider()
    });

    expect(scan.universeCount).toBeGreaterThan(50);
    expect(scan.recommendations.length).toBeGreaterThan(0);
    expect(scan.recommendations.length).toBeLessThanOrEqual(5);
    expect(scan.recommendations[0].rank).toBe(1);
    expect(scan.recommendations[0].probabilityOfProfit).toBeGreaterThan(45);
    expect(scan.recommendations[0].maxRisk).toBeGreaterThan(0);
    expect(scan.recommendations[0].optionLegs.length).toBeGreaterThan(0);
  });
});
