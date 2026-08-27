import { describe, expect, it } from "vitest";
import { DemoMarketDataProvider } from "@/lib/trading/market-data";
import { calculateTechnicals, daysBetween } from "@/lib/trading/math";
import { isLeveragedContractLiquid } from "@/lib/trading/leveraged-policy";
import { strategyRegistry } from "@/lib/trading/strategies";
import type {
  MarketRegime,
  OptionContract,
  StrategyContext,
  TechnicalSnapshot,
  UniverseSymbol
} from "@/lib/trading/types";

const bullishRegime: MarketRegime = {
  label: "risk_on",
  spyTrend: 80,
  qqqTrend: 80,
  vixLevel: 16,
  vixDataAvailable: true,
  breadth: 68,
  score: 75,
  notes: []
};

function bullishTechnicals(
  technicals: TechnicalSnapshot,
  price: number
): TechnicalSnapshot {
  return {
    ...technicals,
    price,
    rsi14: 57,
    macdHistogram: 1,
    atr14: price * 0.012,
    atrPercent: 1.2,
    sma20: price * 0.97,
    sma50: price * 0.93,
    sma200: price * 0.85,
    trendScore: 82,
    momentumScore: 72,
    vwapPosition: "above"
  };
}

function futureDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function conservativeLeveragedContract(
  symbol: string,
  price: number,
  type: "put" | "call"
): OptionContract {
  const strike = Number((price * (type === "put" ? 0.8 : 1.1)).toFixed(2));
  return {
    symbol: `${symbol}-${type}`,
    underlyingSymbol: symbol,
    expirationDate: futureDate(15),
    strike,
    type,
    bid: 0.95,
    ask: 1.03,
    last: 0.99,
    volume: 800,
    openInterest: 3_500,
    impliedVolatility: 0.42,
    delta: type === "put" ? -0.09 : 0.25,
    gamma: 0.015,
    theta: -0.08,
    vega: 0.06
  };
}

async function strategyContext(symbol: UniverseSymbol): Promise<StrategyContext> {
  const provider = new DemoMarketDataProvider();
  const quote = await provider.getQuote(symbol.symbol);
  const candles = await provider.getCandles(symbol.symbol, 240);
  const chain = await provider.getOptionsChain(symbol.symbol);
  const rawTechnicals = calculateTechnicals(symbol.symbol, candles, quote.vwap);
  const technicals = bullishTechnicals(rawTechnicals, quote.price);
  const leveragedContracts = chain.contracts.filter(isLeveragedContractLiquid);
  if (symbol.universeGroup === "leveraged") {
    leveragedContracts.push(
      conservativeLeveragedContract(symbol.symbol, quote.price, "put"),
      conservativeLeveragedContract(symbol.symbol, quote.price, "call")
    );
  }

  return {
    symbol,
    quote,
    chain: {
      ...chain,
      contracts: symbol.universeGroup === "leveraged" ? leveragedContracts : chain.contracts
    },
    technicals,
    referenceTechnicals: symbol.referenceSymbol
      ? bullishTechnicals(
          { ...rawTechnicals, symbol: symbol.referenceSymbol },
          quote.price
        )
      : undefined,
    regime: bullishRegime,
    earnings: { symbol: symbol.symbol, date: null, confirmed: false },
    historicalWinRate: 68,
    ivPercentile: 70,
    rankAllEligibleContracts: false
  };
}

describe("leveraged conservative strategy profile", () => {
  const cashSecuredPut = strategyRegistry.find(
    (strategy) => strategy.type === "cash_secured_put"
  );
  const coveredCall = strategyRegistry.find(
    (strategy) => strategy.type === "covered_call"
  );

  it("selects a buffered low-delta put for a confirmed long leveraged index ETF", async () => {
    const context = await strategyContext({
      symbol: "TQQQ",
      companyName: "ProShares UltraPro QQQ",
      sector: "Leveraged Index",
      universeGroup: "leveraged",
      leverageMultiple: 3,
      leverageDirection: "long",
      referenceSymbol: "QQQ"
    });
    const recommendation = cashSecuredPut?.evaluate(context);

    expect(recommendation).toBeTruthy();
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 1)).toBeGreaterThanOrEqual(0.06);
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 1)).toBeLessThanOrEqual(0.12);
    expect(
      daysBetween(
        new Date().toISOString().slice(0, 10),
        recommendation?.expirationDate ?? ""
      )
    ).toBeGreaterThanOrEqual(10);
    expect(recommendation?.tradePlan.stopLoss).toContain("delta reaches 0.25");
    expect(recommendation?.tradePlan.timeStop).toContain("never hold");
    expect(recommendation?.suggestedPositionSizePct).toBeLessThanOrEqual(0.5);
    expect(recommendation?.assignmentAvoidanceScore).toBeGreaterThan(0);
  });

  it("rejects leveraged inverse products for short puts", async () => {
    const context = await strategyContext({
      symbol: "SQQQ",
      companyName: "ProShares UltraPro Short QQQ",
      sector: "Leveraged Index",
      universeGroup: "leveraged",
      leverageMultiple: 3,
      leverageDirection: "inverse",
      referenceSymbol: "QQQ"
    });

    expect(cashSecuredPut?.evaluate(context)).toBeNull();
  });

  it("uses the leveraged covered-call band while allowing share assignment", async () => {
    const context = await strategyContext({
      symbol: "SQQQ",
      companyName: "ProShares UltraPro Short QQQ",
      sector: "Leveraged Index",
      universeGroup: "leveraged",
      leverageMultiple: 3,
      leverageDirection: "inverse",
      referenceSymbol: "QQQ"
    });
    const recommendation = coveredCall?.evaluate(context);

    expect(recommendation).toBeTruthy();
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 0)).toBeGreaterThanOrEqual(0.2);
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 1)).toBeLessThanOrEqual(0.35);
    expect(recommendation?.tradePlan.exit).toContain("allow assignment");
  });

  it("does not change the ordinary stock put profile", async () => {
    const context = await strategyContext({
      symbol: "AAPL",
      companyName: "Apple",
      sector: "Technology",
      universeGroup: "nasdaq_100"
    });
    const recommendation = cashSecuredPut?.evaluate(context);

    expect(recommendation).toBeTruthy();
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 0)).toBeGreaterThanOrEqual(0.2);
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 1)).toBeLessThanOrEqual(0.4);
    expect(recommendation?.tradePlan.stopLoss).toContain("doubles in value");
    expect(recommendation?.tradePlan.exit).toContain("50-70%");
  });

  it("does not change the ordinary stock covered-call profile", async () => {
    const context = await strategyContext({
      symbol: "AAPL",
      companyName: "Apple",
      sector: "Technology",
      universeGroup: "nasdaq_100"
    });
    const recommendation = coveredCall?.evaluate(context);

    expect(recommendation).toBeTruthy();
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 0)).toBeGreaterThanOrEqual(0.2);
    expect(Math.abs(recommendation?.optionLegs[0].delta ?? 1)).toBeLessThanOrEqual(0.4);
    expect(recommendation?.tradePlan.exit).toContain("70-85%");
    expect(recommendation?.tradePlan.timeStop).toContain("Close before earnings");
    expect(recommendation?.assignmentAvoidanceScore).toBeUndefined();
  });
});
