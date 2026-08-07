import { clamp } from "@/lib/utils";
import { calculateTechnicals, daysBetween, estimateHistoricalWinRate, mean, sma } from "@/lib/trading/math";
import { createMarketDataProvider, getUniverseSymbolsForBreadth } from "@/lib/trading/market-data";
import { getNasdaq100Universe } from "@/lib/trading/nasdaq100";
import { getStrategyCategory } from "@/lib/trading/strategy-categories";
import {
  SHORT_PREMIUM_DELTA_MAX,
  SHORT_PREMIUM_DELTA_MIN,
  strategyRegistry
} from "@/lib/trading/strategies";
import type {
  MarketDataProvider,
  MarketRegime,
  Recommendation,
  ScanResult,
  StrategyContext,
  StrategyType,
  UniverseSymbol
} from "@/lib/trading/types";

interface ScanOptions {
  maxRecommendations?: number;
  allowEarningsVolatility?: boolean;
  strategySlugs?: string[];
  provider?: MarketDataProvider;
  minConfidenceScore?: number;
  minProbabilityOfProfit?: number;
  minLiquidityScore?: number;
  symbols?: string[];
  rankExpirationsIndependently?: boolean;
  dedupeByStrategy?: boolean;
  rankAllEligibleContracts?: boolean;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function daysUntil(date: string | null) {
  if (!date) return 999;
  return daysBetween(new Date().toISOString().slice(0, 10), date);
}

async function trendScoreFor(provider: MarketDataProvider, symbol: string) {
  const candles = await provider.getCandles(symbol, 220);
  const closes = candles.map((candle) => candle.close);
  const latest = closes.at(-1) ?? 0;
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  return clamp(
    50 +
      (latest > sma20 ? 10 : -10) +
      (sma20 > sma50 ? 15 : -15) +
      (sma50 > sma200 ? 18 : -18),
    0,
    100
  );
}

export async function analyzeMarketRegime(provider: MarketDataProvider): Promise<MarketRegime> {
  const [spyResult, qqqResult, vixResult, breadthResult] = await Promise.allSettled([
    trendScoreFor(provider, "SPY"),
    trendScoreFor(provider, "QQQ"),
    provider.getVixLevel(),
    provider.getMarketBreadth(getUniverseSymbolsForBreadth())
  ]);

  const spyTrend = spyResult.status === "fulfilled" ? spyResult.value : 50;
  const qqqTrend = qqqResult.status === "fulfilled" ? qqqResult.value : 50;
  const vixLevel = vixResult.status === "fulfilled" ? vixResult.value : 20;
  const breadth = breadthResult.status === "fulfilled" ? breadthResult.value : 50;
  const failures = [spyResult, qqqResult, vixResult, breadthResult]
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason)
    .map((reason) => (reason instanceof Error ? reason.message : "Market data request failed"));
  const authenticationFailed = failures.some((message) => message.includes("401"));

  const volScore = clamp(100 - Math.max(0, vixLevel - 13) * 4.4, 0, 100);
  const score = Math.round(spyTrend * 0.24 + qqqTrend * 0.3 + breadth * 0.28 + volScore * 0.18);
  let label: MarketRegime["label"] = "neutral";
  if (vixLevel >= 28) label = "high_volatility";
  else if (score >= 62) label = "risk_on";
  else if (score <= 42) label = "risk_off";

  const notes = [
    spyResult.status === "fulfilled" ? `SPY trend score ${Math.round(spyTrend)}` : "SPY trend unavailable",
    qqqResult.status === "fulfilled" ? `QQQ trend score ${Math.round(qqqTrend)}` : "QQQ trend unavailable",
    vixResult.status === "fulfilled" ? `VIX proxy ${vixLevel.toFixed(1)}` : "VIX data unavailable",
    breadthResult.status === "fulfilled"
      ? `${breadth}% of sampled NASDAQ-100 names above 50-day trend`
      : "NASDAQ-100 breadth unavailable",
    ...(failures.length
      ? [
          authenticationFailed
            ? "Market data warning: Tradier authentication failed (401). Check the access token and base URL."
            : "Market data warning: One or more provider requests failed."
        ]
      : [])
  ];

  return {
    label,
    spyTrend: Math.round(spyTrend),
    qqqTrend: Math.round(qqqTrend),
    vixLevel,
    breadth,
    score,
    notes
  };
}

function estimateIvPercentile(contextIvValues: number[], symbol: string) {
  const avgIv = mean(contextIvValues) * 100;
  const symbolBias = (symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1)) % 18;
  return clamp(Math.round((avgIv - 18) * 2.2 + symbolBias), 8, 96);
}

async function scanSymbol(
  provider: MarketDataProvider,
  symbol: UniverseSymbol,
  regime: MarketRegime,
  options: Required<
    Pick<
      ScanOptions,
      "allowEarningsVolatility" | "minConfidenceScore" | "minProbabilityOfProfit" | "minLiquidityScore"
    >
  > &
    Pick<
      ScanOptions,
      "strategySlugs" | "rankExpirationsIndependently" | "dedupeByStrategy" | "rankAllEligibleContracts"
    >
) {
  const [quote, candles, chain, earnings] = await Promise.all([
    provider.getQuote(symbol.symbol),
    provider.getCandles(symbol.symbol, 240),
    provider.getOptionsChain(symbol.symbol),
    provider.getEarningsDate(symbol.symbol)
  ]);

  if (!chain.contracts.length || quote.price <= 0) return [];
  if (!options.allowEarningsVolatility && daysUntil(earnings.date) <= 7) return [];

  const liquidContracts = chain.contracts.filter((contract) => {
    const mid = (contract.bid + contract.ask) / 2;
    const spread = mid ? ((contract.ask - contract.bid) / mid) * 100 : 100;
    return contract.volume >= 75 && contract.openInterest >= 250 && spread <= 18;
  });

  if (liquidContracts.length < 10) return [];

  const technicals = calculateTechnicals(symbol.symbol, candles, quote.vwap);
  const ivPercentile = estimateIvPercentile(
    liquidContracts.map((contract) => contract.impliedVolatility),
    symbol.symbol
  );

  const enabledStrategies = strategyRegistry.filter(
    (strategy) =>
      strategy.enabledByDefault &&
      (!options.strategySlugs?.length || options.strategySlugs.includes(strategy.type))
  );

  const contractGroups = options.rankExpirationsIndependently
    ? Array.from(new Set(liquidContracts.map((contract) => contract.expirationDate)))
        .sort()
        .map((expirationDate) =>
          liquidContracts.filter((contract) => contract.expirationDate === expirationDate)
        )
        .filter((contracts) => contracts.length >= 8)
    : [liquidContracts];

  const candidates = contractGroups
    .flatMap((contractsForScan) => {
      const strategyContext: StrategyContext = {
        symbol,
        quote,
        chain: { ...chain, contracts: contractsForScan },
        technicals,
        regime,
        earnings,
        historicalWinRate: estimateHistoricalWinRate(
          "cash_secured_put",
          technicals.trendScore,
          regime.score
        ),
        ivPercentile,
        rankAllEligibleContracts: options.rankAllEligibleContracts
      };

      return enabledStrategies.map((strategy) => strategy.evaluate(strategyContext));
    })
    .filter((recommendation): recommendation is Recommendation => Boolean(recommendation))
    .filter(
      (recommendation) =>
        recommendation.confidenceScore >= options.minConfidenceScore &&
        recommendation.probabilityOfProfit >= options.minProbabilityOfProfit &&
        recommendation.liquidityScore >= options.minLiquidityScore &&
        recommendation.maxRisk > 0 &&
        recommendation.optionLegs.every((leg) => {
          const absoluteDelta = Math.abs(leg.delta);
          return absoluteDelta >= SHORT_PREMIUM_DELTA_MIN && absoluteDelta <= SHORT_PREMIUM_DELTA_MAX;
        })
    )
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  if (options.dedupeByStrategy === false) {
    return candidates;
  }

  const bestByStrategy = new Map<StrategyType, Recommendation>();
  for (const candidate of candidates) {
    if (!bestByStrategy.has(candidate.strategyType)) {
      bestByStrategy.set(candidate.strategyType, candidate);
    }
  }

  return Array.from(bestByStrategy.values());
}

function normalizeTicker(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function resolveUniverse(symbols?: string[]): UniverseSymbol[] {
  const defaultUniverse = getNasdaq100Universe();
  if (!symbols?.length) return defaultUniverse;

  const bySymbol = new Map(defaultUniverse.map((item) => [item.symbol, item]));
  const uniqueSymbols = Array.from(new Set(symbols.map(normalizeTicker).filter(Boolean)));
  return uniqueSymbols.map(
    (symbol) =>
      bySymbol.get(symbol) ?? {
        symbol,
        companyName: symbol,
        sector: "Custom"
      }
  );
}

function recommendationCompositeScore(recommendation: Recommendation) {
  return (
    recommendation.confidenceScore * 0.38 +
    recommendation.probabilityOfProfit * 0.24 +
    recommendation.liquidityScore * 0.16 +
    recommendation.historicalWinRate * 0.12 +
    recommendation.riskRewardRatio * 10
  );
}

function sortRecommendations(items: Recommendation[]) {
  return items.sort((a, b) => recommendationCompositeScore(b) - recommendationCompositeScore(a));
}

function limitPerStrategy(items: Recommendation[], maxPerStrategy: number) {
  const limited: Recommendation[] = [];
  const counts = new Map<StrategyType, number>();

  for (const recommendation of sortRecommendations(items)) {
    const count = counts.get(recommendation.strategyType) ?? 0;
    if (count >= maxPerStrategy) continue;
    counts.set(recommendation.strategyType, count + 1);
    limited.push(recommendation);
  }

  return limited;
}

export async function runDailyOptionsScan(options: ScanOptions = {}): Promise<ScanResult> {
  const provider = options.provider ?? createMarketDataProvider();
  const universe = resolveUniverse(options.symbols);
  const startedAt = new Date().toISOString();
  const marketRegime = await analyzeMarketRegime(provider);
  const warnings = marketRegime.notes
    .filter((note) => note.startsWith("Market data warning:"))
    .map((note) => note.replace("Market data warning: ", ""));
  const recommendations: Recommendation[] = [];
  let analyzedCount = 0;
  let skippedCount = 0;

  if (warnings.some((warning) => warning.includes("authentication failed (401)"))) {
    return {
      scanDate: new Date().toISOString().slice(0, 10),
      startedAt,
      completedAt: new Date().toISOString(),
      marketRegime,
      universeCount: universe.length,
      analyzedCount,
      skippedCount: universe.length,
      recommendations,
      warnings
    };
  }

  for (const universeChunk of chunk(universe, 8)) {
    const results = await Promise.allSettled(
      universeChunk.map((symbol) =>
        scanSymbol(provider, symbol, marketRegime, {
          allowEarningsVolatility: options.allowEarningsVolatility ?? false,
          strategySlugs: options.strategySlugs,
          minConfidenceScore: options.minConfidenceScore ?? 42,
          minProbabilityOfProfit: options.minProbabilityOfProfit ?? 45,
          minLiquidityScore: options.minLiquidityScore ?? 35,
          rankExpirationsIndependently: options.rankExpirationsIndependently ?? false,
          dedupeByStrategy: options.dedupeByStrategy ?? true,
          rankAllEligibleContracts: options.rankAllEligibleContracts ?? true
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.length) {
        recommendations.push(...result.value);
        analyzedCount += result.value.length;
      } else {
        skippedCount += 1;
        if (result.status === "rejected") {
          warnings.push(result.reason instanceof Error ? result.reason.message : "Unknown scanner error");
        }
      }
    }
  }

  const maxPerStrategy = options.maxRecommendations ?? 15;
  const basicRanked = limitPerStrategy(
    recommendations.filter((recommendation) => getStrategyCategory(recommendation.strategyType) === "basic"),
    maxPerStrategy
  );
  const advancedRanked = limitPerStrategy(
    recommendations.filter((recommendation) => getStrategyCategory(recommendation.strategyType) === "advanced"),
    maxPerStrategy
  );
  const ranked = [...basicRanked, ...advancedRanked].map((recommendation, index) => ({
    ...recommendation,
    rank: index + 1
  }));

  return {
    scanDate: new Date().toISOString().slice(0, 10),
    startedAt,
    completedAt: new Date().toISOString(),
    marketRegime,
    universeCount: universe.length,
    analyzedCount,
    skippedCount,
    recommendations: ranked,
    warnings: Array.from(new Set(warnings)).slice(0, 8)
  };
}

export async function runTickerOptionsScan(symbol: string, options: Omit<ScanOptions, "symbols"> = {}): Promise<ScanResult> {
  const maxRecommendations = options.maxRecommendations ?? 5;
  const scan = await runDailyOptionsScan({
    ...options,
    symbols: [symbol],
    maxRecommendations,
    minConfidenceScore: options.minConfidenceScore ?? 42,
    minProbabilityOfProfit: options.minProbabilityOfProfit ?? 40,
    minLiquidityScore: options.minLiquidityScore ?? 30,
    rankExpirationsIndependently: true,
    dedupeByStrategy: false,
    rankAllEligibleContracts: true
  });
  const ranked = sortRecommendations(scan.recommendations)
    .slice(0, maxRecommendations)
    .map((recommendation, index) => ({
      ...recommendation,
      rank: index + 1
    }));

  return {
    ...scan,
    recommendations: ranked
  };
}
