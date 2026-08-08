import { describe, expect, it } from "vitest";
import { DemoMarketDataProvider } from "@/lib/trading/market-data";
import { DEFAULT_NASDAQ_100_UNIVERSE } from "@/lib/trading/nasdaq100";
import { runDailyOptionsScan, runTickerOptionsScan } from "@/lib/trading/scanner";
import type { Candle } from "@/lib/trading/types";

describe("daily options scanner", () => {
  it("returns a degraded result instead of throwing when market data fails", async () => {
    class UnauthorizedMarketDataProvider extends DemoMarketDataProvider {
      override async getCandles(_symbol: string, _lookbackDays: number): Promise<Candle[]> {
        throw new Error("Tradier request failed 401: /markets/history");
      }
    }

    const scan = await runDailyOptionsScan({
      maxRecommendations: 15,
      provider: new UnauthorizedMarketDataProvider()
    });

    expect(scan.recommendations).toHaveLength(0);
    expect(scan.marketRegime.label).toBe("neutral");
    expect(scan.warnings).toContain(
      "Tradier authentication failed (401). Check the access token and base URL."
    );
  });

  it("produces ranked, risk-bounded recommendations", async () => {
    const scan = await runDailyOptionsScan({
      maxRecommendations: 15,
      provider: new DemoMarketDataProvider()
    });

    expect(scan.universeCount).toBeGreaterThan(50);
    expect(scan.recommendations.length).toBeGreaterThan(0);
    expect(scan.recommendations.length).toBeLessThanOrEqual(30);
    expect(
      scan.recommendations.filter(
        (recommendation) => recommendation.strategyType === "cash_secured_put"
      )
    ).toHaveLength(15);
    expect(
      scan.recommendations.filter(
        (recommendation) => recommendation.strategyType === "covered_call"
      )
    ).toHaveLength(15);
    const nasdaq100Symbols = new Set(DEFAULT_NASDAQ_100_UNIVERSE.map((item) => item.symbol));
    expect(
      scan.recommendations.every((recommendation) =>
        ["cash_secured_put", "covered_call"].includes(recommendation.strategyType)
      )
    ).toBe(true);
    expect(scan.recommendations.every((recommendation) => nasdaq100Symbols.has(recommendation.symbol))).toBe(true);
    expect(
      scan.recommendations.every((recommendation) =>
        recommendation.optionLegs.every((leg) => Math.abs(leg.delta) >= 0.2 && Math.abs(leg.delta) <= 0.4)
      )
    ).toBe(true);
    expect(scan.recommendations[0].rank).toBe(1);
    expect(scan.recommendations[0].probabilityOfProfit).toBeGreaterThan(45);
    expect(scan.recommendations[0].maxRisk).toBeGreaterThan(0);
    expect(scan.recommendations[0].optionLegs.length).toBeGreaterThan(0);
    expect(
      scan.recommendations.every((recommendation) =>
        recommendation.rationale.some((reason) => reason.includes("Theta contributes"))
      )
    ).toBe(true);
  });

  it("produces top-ranked choices for a custom ticker outside the daily universe flow", async () => {
    const scan = await runTickerOptionsScan("TSLA", {
      maxRecommendations: 5,
      provider: new DemoMarketDataProvider()
    });

    expect(scan.universeCount).toBe(1);
    expect(scan.recommendations.length).toBe(5);
    expect(scan.recommendations.every((recommendation) => recommendation.symbol === "TSLA")).toBe(true);
    expect(
      scan.recommendations.every((recommendation) =>
        ["cash_secured_put", "covered_call"].includes(recommendation.strategyType) &&
        recommendation.optionLegs.every((leg) => Math.abs(leg.delta) >= 0.2 && Math.abs(leg.delta) <= 0.4)
      )
    ).toBe(true);
    expect(scan.recommendations[0].rank).toBe(1);
  });
});
