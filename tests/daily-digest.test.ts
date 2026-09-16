import { describe, expect, it } from "vitest";
import {
  digestSubject,
  renderDailyDigestEmail,
  selectDigestRecommendations,
  shouldReceiveDailyDigest
} from "@/lib/email/daily-digest";
import type { Recommendation, ScanResult, StrategyType } from "@/lib/trading/types";

function recommendation(
  symbol: string,
  strategyType: StrategyType,
  rank: number
): Recommendation {
  const isPut = strategyType === "cash_secured_put";
  return {
    rank,
    symbol,
    companyName: `${symbol} Holdings`,
    sector: "Technology",
    universeGroup: "nasdaq_100",
    strategyType,
    strategyName: isPut ? "Cash-Secured Put" : "Covered Call",
    entryRecommendation: `Sell the ${isPut ? "put" : "call"} for a $2.00 credit.`,
    exitRecommendation: "Close at the profit target.",
    underlyingPrice: 100,
    strikePrice: isPut ? 90 : 110,
    expirationDate: "2026-09-18",
    probabilityOfProfit: 70,
    expectedMove: 8,
    maxRisk: 8_800,
    maxReward: 200,
    riskRewardRatio: 0.02,
    confidenceScore: 80 - rank,
    greeks: { delta: isPut ? 0.25 : -0.25, gamma: -0.02, theta: 0.1, vega: -0.03 },
    ivPercentile: 70,
    liquidityScore: 85,
    technicalScore: 75,
    historicalWinRate: 68,
    suggestedPositionSizePct: 0.35,
    optionLegs: [
      {
        action: "sell",
        type: isPut ? "put" : "call",
        strike: isPut ? 90 : 110,
        expirationDate: "2026-09-18",
        bid: 1.9,
        ask: 2.1,
        mid: 2,
        delta: isPut ? -0.25 : 0.25,
        gamma: 0.02,
        theta: -0.1,
        impliedVolatility: 0.5
      }
    ],
    tradePlan: {
      entry: "Sell to open.",
      exit: "Close at target.",
      stopLoss: "Close at stop.",
      profitTarget: "Close at 50% profit.",
      timeStop: "Close by 7 DTE."
    },
    rationale: ["The setup passed today's liquidity and probability checks."],
    warnings: [],
    createdAt: "2026-08-27T14:30:00.000Z",
    expiresAt: "2026-09-18T21:00:00.000Z"
  };
}

const scan: ScanResult = {
  scanId: "scan-1",
  scanDate: "2026-08-27",
  startedAt: "2026-08-27T14:30:00.000Z",
  completedAt: "2026-08-27T14:31:00.000Z",
  marketRegime: {
    label: "risk_on",
    spyTrend: 70,
    qqqTrend: 72,
    vixLevel: 17,
    breadth: 65,
    score: 70,
    notes: []
  },
  universeCount: 200,
  analyzedCount: 4,
  skippedCount: 196,
  recommendations: [],
  warnings: []
};

describe("daily digest selection", () => {
  const ranked = [
    recommendation("MSTR", "covered_call", 1),
    recommendation("AAPL", "cash_secured_put", 2),
    recommendation("MSFT", "covered_call", 3),
    recommendation("NVDA", "cash_secured_put", 4),
    recommendation("AMD", "covered_call", 5),
    recommendation("META", "cash_secured_put", 6),
    recommendation("AMZN", "covered_call", 7),
    recommendation("GOOGL", "cash_secured_put", 8),
    recommendation("AVGO", "covered_call", 9),
    recommendation("TSLA", "cash_secured_put", 10),
    recommendation("ORCL", "covered_call", 11)
  ];

  it("uses the email preference independently of billing access", () => {
    expect(shouldReceiveDailyDigest({ email_digest_enabled: true, access_status: "active" })).toBe(true);
    expect(shouldReceiveDailyDigest({ email_digest_enabled: false, access_status: "active" })).toBe(false);
    expect(shouldReceiveDailyDigest({ email_digest_enabled: true, access_status: "inactive" })).toBe(false);
  });

  it("includes both primary income strategies when both are available", () => {
    const selected = selectDigestRecommendations(ranked, 3);

    expect(selected[0].symbol).toBe("MSTR");
    expect(new Set(selected.map((item) => item.strategyType))).toEqual(
      new Set(["cash_secured_put", "covered_call"])
    );
  });

  it("uses the canonical top three digest symbols in the subject", () => {
    const subject = digestSubject("2026-08-27", ranked);

    expect(subject).toBe("Figure My Money: MSTR, AAPL, MSFT | 2026-08-27");
  });

  it("selects ten combined put and call ideas while keeping the subject to three", () => {
    const selected = selectDigestRecommendations(ranked, 10);
    const subject = digestSubject("2026-08-27", selected);

    expect(selected).toHaveLength(10);
    expect(new Set(selected.map((item) => item.strategyType))).toEqual(
      new Set(["cash_secured_put", "covered_call"])
    );
    expect(subject).toBe("Figure My Money: MSTR, AAPL, MSFT | 2026-08-27");
  });

  it("renders all ten selected recommendations in the email body", () => {
    const selected = selectDigestRecommendations(ranked, 10);
    const html = renderDailyDigestEmail(scan, selected);

    expect(html).toContain("#10");
    expect(html).toContain("TSLA");
    expect(html).not.toContain("ORCL");
  });

  it("renders the current contract details that distinguish each daily idea", () => {
    const html = renderDailyDigestEmail(scan, [ranked[1]]);

    expect(html).toContain("Stock price");
    expect(html).toContain("2026-09-18");
    expect(html).toContain("$90");
    expect(html).toContain("$200");
    expect(html).toContain("APY");
  });

  it("renders the same account link for every recipient", () => {
    const html = renderDailyDigestEmail(scan, ranked.slice(0, 10));

    expect(html).toContain("Open Figure My Money");
    expect(html).toContain("/login");
  });
});
