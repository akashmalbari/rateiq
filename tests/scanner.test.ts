import { describe, expect, it } from "vitest";
import { DemoMarketDataProvider } from "@/lib/trading/market-data";
import { DEFAULT_NASDAQ_100_UNIVERSE } from "@/lib/trading/nasdaq100";
import {
  recommendationAnnualizedYield,
  sortRecommendationsByAnnualizedYield
} from "@/lib/trading/annualized-yield";
import { runDailyOptionsScan, runTickerOptionsScan } from "@/lib/trading/scanner";
import { getDailyOptionsUniverse, resolveUniverseGroup } from "@/lib/trading/universes";
import type { Candle } from "@/lib/trading/types";

describe("daily options scanner", () => {
  it("adds administrator-managed symbols as a dedicated universe", () => {
    const universe = getDailyOptionsUniverse(["AAPL", "IBM"]);
    const adminPicks = universe.filter((item) => item.universeGroup === "admin_picks");

    expect(adminPicks.map((item) => item.symbol)).toEqual(["AAPL", "IBM"]);
    expect(adminPicks.every((item) => item.sector === "Admin's Picks")).toBe(true);
  });

  it("returns a degraded result instead of throwing when market data fails", async () => {
    class UnauthorizedMarketDataProvider extends DemoMarketDataProvider {
      override async getCandles(_symbol: string, _lookbackDays: number): Promise<Candle[]> {
        throw new Error("Tradier request failed 401: /markets/history");
      }
    }

    const scan = await runDailyOptionsScan({
      maxRecommendations: 15,
      provider: new UnauthorizedMarketDataProvider(),
      adminPickSymbols: []
    });

    expect(scan.recommendations).toHaveLength(0);
    expect(scan.analyzedCount).toBe(0);
    expect(scan.warnings).toContain(
      "Tradier authentication failed (401). Check the access token and base URL."
    );
  });

  it("produces ranked, risk-bounded recommendations", async () => {
    const adminPickSymbols = ["AAPL", "MSFT"];
    const scan = await runDailyOptionsScan({
      maxRecommendations: 15,
      provider: new DemoMarketDataProvider(),
      adminPickSymbols
    });

    expect(scan.universeCount).toBe(getDailyOptionsUniverse(adminPickSymbols).length);
    expect(scan.universeCount).toBeGreaterThan(DEFAULT_NASDAQ_100_UNIVERSE.length);
    expect(scan.recommendations.length).toBeGreaterThan(0);
    expect(scan.recommendations.length).toBeLessThanOrEqual(120);
    const nasdaq100Symbols = new Set(DEFAULT_NASDAQ_100_UNIVERSE.map((item) => item.symbol));
    expect(
      scan.recommendations.every((recommendation) =>
        ["cash_secured_put", "covered_call"].includes(recommendation.strategyType)
      )
    ).toBe(true);
    expect(new Set(scan.recommendations.map((recommendation) => recommendation.universeGroup))).toEqual(
      new Set(["nasdaq_100", "under_100", "admin_picks"])
    );
    expect(
      scan.recommendations
        .filter((recommendation) => recommendation.universeGroup === "nasdaq_100")
        .every((recommendation) => nasdaq100Symbols.has(recommendation.symbol))
    ).toBe(true);
    expect(
      scan.recommendations
        .filter((recommendation) => recommendation.universeGroup === "under_100")
        .every(
          (recommendation) =>
            !nasdaq100Symbols.has(recommendation.symbol) &&
            recommendation.underlyingPrice >= 10 &&
            recommendation.underlyingPrice < 100
        )
    ).toBe(true);
    expect(
      scan.recommendations
        .every((recommendation) =>
          recommendation.optionLegs.every(
            (leg) => Math.abs(leg.delta) >= 0.2 && Math.abs(leg.delta) <= 0.4
          )
        )
    ).toBe(true);
    expect(
      scan.recommendations
        .filter((recommendation) => recommendation.universeGroup === "admin_picks")
        .every((recommendation) => adminPickSymbols.includes(recommendation.symbol))
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

    for (const strategyType of ["cash_secured_put", "covered_call"] as const) {
      for (const universeGroup of ["nasdaq_100", "under_100", "admin_picks"] as const) {
        const group = scan.recommendations.filter(
          (recommendation) =>
            recommendation.strategyType === strategyType &&
            recommendation.universeGroup === universeGroup
        );
        expect(group.length).toBeLessThanOrEqual(15);
        const sorted = sortRecommendationsByAnnualizedYield(group);
        const yields = sorted.map(
          (recommendation) => recommendationAnnualizedYield(recommendation)?.annualizedYieldPct ?? -Infinity
        );
        expect(yields).toEqual([...yields].sort((left, right) => right - left));
      }
    }
  });

  it("removes sub-$10 discovery while preserving explicit universe groups", () => {
    const priceScreenSymbol = { symbol: "F", companyName: "Ford", sector: "Consumer Cyclical" };
    const nasdaqSymbol = {
      symbol: "WBD",
      companyName: "Warner Bros. Discovery",
      sector: "Communication Services",
      universeGroup: "nasdaq_100" as const
    };
    const adminSymbol = {
      symbol: "XYZ",
      companyName: "XYZ",
      sector: "Admin's Picks",
      universeGroup: "admin_picks" as const
    };

    expect(resolveUniverseGroup(priceScreenSymbol, 9.99)).toBeNull();
    expect(resolveUniverseGroup(priceScreenSymbol, 10)).toBe("under_100");
    expect(resolveUniverseGroup(priceScreenSymbol, 99.99)).toBe("under_100");
    expect(resolveUniverseGroup(priceScreenSymbol, 100)).toBeNull();
    expect(resolveUniverseGroup(nasdaqSymbol, 7)).toBe("nasdaq_100");
    expect(resolveUniverseGroup(adminSymbol, 3)).toBe("admin_picks");
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
