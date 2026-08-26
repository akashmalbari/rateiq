import { describe, expect, it } from "vitest";
import { storedRecommendationToDomain } from "@/lib/trading/persistence";
import type { Database } from "@/lib/supabase/database.types";

type StoredRecommendation = Database["public"]["Tables"]["recommendations"]["Row"];

function storedRecommendation(overrides: Partial<StoredRecommendation> = {}): StoredRecommendation {
  return {
    id: "recommendation-1",
    scan_id: "scan-1",
    symbol: "TQQQ",
    company_name: "ProShares UltraPro QQQ",
    strategy_type: "cash_secured_put",
    entry: {
      recommendation: "Sell the 90 put.",
      underlyingPrice: 100
    },
    exit_plan: {
      entry: "Sell the 90 put.",
      exit: "Close at 50% profit.",
      stopLoss: "Close at 2x credit.",
      profitTarget: "Close at 50% profit.",
      timeStop: "Close by 7 DTE."
    },
    option_legs: [
      {
        action: "sell",
        type: "put",
        strike: 90,
        expirationDate: "2026-09-18",
        bid: 1.9,
        ask: 2.1,
        mid: 2,
        delta: -0.25,
        gamma: 0.02,
        theta: -0.1,
        impliedVolatility: 0.5
      }
    ],
    probability_of_profit: 70,
    expected_move: 8,
    max_risk: 8800,
    max_reward: 200,
    risk_reward_ratio: 0.02,
    confidence_score: 75,
    greeks: { delta: 0.25, gamma: -0.02, theta: 0.1, vega: -0.03 },
    iv_percentile: 70,
    liquidity_score: 80,
    technical_score: 72,
    historical_win_rate: 68,
    suggested_position_size_pct: 1,
    rationale: ["Liquid contract."],
    warnings: ["Daily-reset leveraged ETF."],
    expires_at: "2026-09-18T21:00:00Z",
    status: "open",
    created_at: "2026-08-26T14:30:00Z",
    ...overrides
  };
}

describe("stored scan recommendations", () => {
  it("restores leveraged metadata for recommendations saved before metadata persistence", () => {
    const recommendation = storedRecommendationToDomain(storedRecommendation(), 1);

    expect(recommendation.universeGroup).toBe("leveraged");
    expect(recommendation.leverageMultiple).toBe(3);
    expect(recommendation.leverageDirection).toBe("long");
    expect(recommendation.underlyingPrice).toBe(100);
    expect(recommendation.strikePrice).toBe(90);
    expect(recommendation.expirationDate).toBe("2026-09-18");
  });

  it("restores price-screen groups using the captured underlying price", () => {
    const recommendation = storedRecommendationToDomain(
      storedRecommendation({
        symbol: "F",
        company_name: "Ford Motor",
        entry: { recommendation: "Sell the 10 put.", underlyingPrice: 11 }
      }),
      2
    );

    expect(recommendation.universeGroup).toBe("under_100");
    expect(recommendation.rank).toBe(2);
  });
});
