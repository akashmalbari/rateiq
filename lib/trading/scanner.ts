import { clamp } from "@/lib/utils";
import { calculateTechnicals, daysBetween, estimateHistoricalWinRate, mean, sma } from "@/lib/trading/math";
import { createMarketDataProvider, getUniverseSymbolsForBreadth } from "@/lib/trading/market-data";
import { getNasdaq100Universe } from "@/lib/trading/nasdaq100";
import { strategyRegistry } from "@/lib/trading/strategies";
import type {
  MarketDataProvider,
  MarketRegime,
  Recommendation,
  ScanResult,
  StrategyContext
} from "@/lib/trading/types";

interface ScanOptions {
  maxRecommendations?: number;
  allowEarningsVolatility?: boolean;
  strategySlugs?: string[];
  provider?: MarketDataProvider;
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
  const [spyTrend, qqqTrend, vixLevel, breadth] = await Promise.all([
    trendScoreFor(provider, "SPY"),
    trendScoreFor(provider, "QQQ"),
    provider.getVixLevel(),
    provider.getMarketBreadth(getUniverseSymbolsForBreadth())
  ]);

  const volScore = clamp(100 - Math.max(0, vixLevel - 13) * 4.4, 0, 100);
  const score = Math.round(spyTrend * 0.24 + qqqTrend * 0.3 + breadth * 0.28 + volScore * 0.18);
  let label: MarketRegime["label"] = "neutral";
  if (vixLevel >= 28) label = "high_volatility";
  else if (score >= 62) label = "risk_on";
  else if (score <= 42) label = "risk_off";

  const notes = [
    `SPY trend score ${Math.round(spyTrend)}`,
    `QQQ trend score ${Math.round(qqqTrend)}`,
    `VIX proxy ${vixLevel.toFixed(1)}`,
    `${breadth}% of sampled NASDAQ-100 names above 50-day trend`
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
  symbol: ReturnType<typeof getNasdaq100Universe>[number],
  regime: MarketRegime,
  options: Required<Pick<ScanOptions, "allowEarningsVolatility">> & Pick<ScanOptions, "strategySlugs">
) {
  const [quote, candles, chain, earnings] = await Promise.all([
    provider.getQuote(symbol.symbol),
    provider.getCandles(symbol.symbol, 240),
    provider.getOptionsChain(symbol.symbol),
    provider.getEarningsDate(symbol.symbol)
  ]);

  if (!chain.contracts.length || quote.price <= 0) return null;
  if (!options.allowEarningsVolatility && daysUntil(earnings.date) <= 7) return null;

  const liquidContracts = chain.contracts.filter((contract) => {
    const mid = (contract.bid + contract.ask) / 2;
    const spread = mid ? ((contract.ask - contract.bid) / mid) * 100 : 100;
    return contract.volume >= 75 && contract.openInterest >= 250 && spread <= 18;
  });

  if (liquidContracts.length < 10) return null;

  const technicals = calculateTechnicals(symbol.symbol, candles, quote.vwap);
  const ivPercentile = estimateIvPercentile(
    liquidContracts.map((contract) => contract.impliedVolatility),
    symbol.symbol
  );

  const strategyContext: StrategyContext = {
    symbol,
    quote,
    chain: { ...chain, contracts: liquidContracts },
    technicals,
    regime,
    earnings,
    historicalWinRate: estimateHistoricalWinRate("cash_secured_put", technicals.trendScore, regime.score),
    ivPercentile
  };

  const enabledStrategies = strategyRegistry.filter(
    (strategy) =>
      strategy.enabledByDefault &&
      (!options.strategySlugs?.length || options.strategySlugs.includes(strategy.type))
  );

  const candidates = enabledStrategies
    .map((strategy) => strategy.evaluate(strategyContext))
    .filter((recommendation): recommendation is Recommendation => Boolean(recommendation))
    .filter(
      (recommendation) =>
        recommendation.confidenceScore >= 58 &&
        recommendation.probabilityOfProfit >= 48 &&
        recommendation.liquidityScore >= 42 &&
        recommendation.maxRisk > 0
    )
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  return candidates[0] ?? null;
}

export async function runDailyOptionsScan(options: ScanOptions = {}): Promise<ScanResult> {
  const provider = options.provider ?? createMarketDataProvider();
  const universe = getNasdaq100Universe();
  const startedAt = new Date().toISOString();
  const warnings: string[] = [];
  const marketRegime = await analyzeMarketRegime(provider);
  const recommendations: Recommendation[] = [];
  let analyzedCount = 0;
  let skippedCount = 0;

  for (const universeChunk of chunk(universe, 8)) {
    const results = await Promise.allSettled(
      universeChunk.map((symbol) =>
        scanSymbol(provider, symbol, marketRegime, {
          allowEarningsVolatility: options.allowEarningsVolatility ?? false,
          strategySlugs: options.strategySlugs
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        recommendations.push(result.value);
        analyzedCount += 1;
      } else {
        skippedCount += 1;
        if (result.status === "rejected") {
          warnings.push(result.reason instanceof Error ? result.reason.message : "Unknown scanner error");
        }
      }
    }
  }

  const ranked = recommendations
    .sort((a, b) => {
      const aComposite =
        a.confidenceScore * 0.38 +
        a.probabilityOfProfit * 0.24 +
        a.liquidityScore * 0.16 +
        a.historicalWinRate * 0.12 +
        a.riskRewardRatio * 10;
      const bComposite =
        b.confidenceScore * 0.38 +
        b.probabilityOfProfit * 0.24 +
        b.liquidityScore * 0.16 +
        b.historicalWinRate * 0.12 +
        b.riskRewardRatio * 10;
      return bComposite - aComposite;
    })
    .slice(0, options.maxRecommendations ?? 10)
    .map((recommendation, index) => ({ ...recommendation, rank: index + 1 }));

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
