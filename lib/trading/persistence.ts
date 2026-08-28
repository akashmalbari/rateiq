import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import { strategyRegistry } from "@/lib/trading/strategies";
import { getDailyOptionsUniverse, resolveUniverseGroup } from "@/lib/trading/universes";
import type {
  MarketRegime,
  OptionLeg,
  Recommendation,
  ScanResult,
  StrategyType,
  TradePlan,
  UniverseGroup
} from "@/lib/trading/types";

type StoredRecommendation = Database["public"]["Tables"]["recommendations"]["Row"];
const dailyUniverseBySymbol = new Map(
  getDailyOptionsUniverse().map((symbol) => [symbol.symbol, symbol])
);

function jsonObject(value: Json) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function isUniverseGroup(value: unknown): value is UniverseGroup {
  return ["nasdaq_100", "under_100", "admin_picks", "custom"].includes(
    String(value)
  );
}

export function storedRecommendationToDomain(
  row: StoredRecommendation,
  rank: number
): Recommendation {
  const entry = jsonObject(row.entry);
  const optionLegs = row.option_legs as unknown as OptionLeg[];
  const tradePlan = row.exit_plan as unknown as TradePlan;
  const greeks = row.greeks as unknown as Recommendation["greeks"];
  const underlyingPrice = Number(entry.underlyingPrice ?? 0);
  const universeSymbol = dailyUniverseBySymbol.get(row.symbol);
  const storedGroup = entry.universeGroup;
  const universeGroup = isUniverseGroup(storedGroup)
    ? storedGroup
    : universeSymbol
      ? resolveUniverseGroup(universeSymbol, underlyingPrice) ?? "custom"
      : "custom";
  const strategyType = row.strategy_type as StrategyType;
  const strategyName =
    strategyRegistry.find((strategy) => strategy.type === strategyType)?.name ??
    row.strategy_type.replaceAll("_", " ");
  const primaryLeg = optionLegs[0];

  return {
    id: row.id,
    rank,
    symbol: row.symbol,
    companyName: row.company_name,
    sector: String(entry.sector ?? universeSymbol?.sector ?? "Unclassified"),
    universeGroup,
    strategyType,
    strategyName,
    entryRecommendation: String(entry.recommendation ?? tradePlan.entry ?? ""),
    exitRecommendation: tradePlan.exit,
    underlyingPrice,
    strikePrice: primaryLeg?.strike ?? 0,
    expirationDate: primaryLeg?.expirationDate ?? row.expires_at.slice(0, 10),
    probabilityOfProfit: row.probability_of_profit,
    expectedMove: row.expected_move,
    maxRisk: row.max_risk,
    maxReward: row.max_reward,
    riskRewardRatio: row.risk_reward_ratio,
    confidenceScore: row.confidence_score,
    greeks,
    ivPercentile: row.iv_percentile,
    liquidityScore: row.liquidity_score,
    technicalScore: row.technical_score,
    historicalWinRate: row.historical_win_rate,
    suggestedPositionSizePct: row.suggested_position_size_pct,
    optionLegs,
    tradePlan,
    rationale: row.rationale,
    warnings: row.warnings,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

function recommendationToInsert(scanId: string, recommendation: Recommendation) {
  return {
    scan_id: scanId,
    symbol: recommendation.symbol,
    company_name: recommendation.companyName,
    strategy_type: recommendation.strategyType,
    entry: {
      recommendation: recommendation.entryRecommendation,
      plan: recommendation.tradePlan.entry,
      underlyingPrice: recommendation.underlyingPrice,
      sector: recommendation.sector,
      universeGroup: recommendation.universeGroup
    },
    exit_plan: recommendation.tradePlan,
    option_legs: recommendation.optionLegs,
    probability_of_profit: recommendation.probabilityOfProfit,
    expected_move: recommendation.expectedMove,
    max_risk: recommendation.maxRisk,
    max_reward: recommendation.maxReward,
    risk_reward_ratio: recommendation.riskRewardRatio,
    confidence_score: recommendation.confidenceScore,
    greeks: recommendation.greeks,
    iv_percentile: recommendation.ivPercentile,
    liquidity_score: recommendation.liquidityScore,
    technical_score: recommendation.technicalScore,
    historical_win_rate: recommendation.historicalWinRate,
    suggested_position_size_pct: recommendation.suggestedPositionSizePct,
    rationale: recommendation.rationale,
    warnings: recommendation.warnings,
    expires_at: recommendation.expiresAt,
    status: "open" as const,
    created_at: recommendation.createdAt
  };
}

export async function persistScanResult(scan: ScanResult, createdBy?: string | null) {
  if (!isSupabaseConfigured) {
    return {
      ...scan,
      scanId: `demo-${scan.scanDate}`
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: scanRow, error: scanError } = await supabase
    .from("scans")
    .insert({
      scan_date: scan.scanDate,
      started_at: scan.startedAt,
      completed_at: scan.completedAt,
      status: "completed",
      market_regime: scan.marketRegime,
      universe_count: scan.universeCount,
      recommendation_count: scan.recommendations.length,
      created_by: createdBy ?? null
    })
    .select("id")
    .single();

  if (scanError || !scanRow) {
    throw new Error(scanError?.message ?? "Failed to persist scan.");
  }

  const scanId = scanRow.id;
  if (scan.recommendations.length) {
    const { error } = await supabase
      .from("recommendations")
      .insert(scan.recommendations.map((recommendation) => recommendationToInsert(scanId, recommendation)));

    if (error) {
      throw new Error(error.message);
    }

    const optionContracts = scan.recommendations.flatMap((recommendation) =>
      recommendation.optionLegs.map((leg) => ({
        symbol: `${recommendation.symbol}-${leg.expirationDate}-${leg.type}-${leg.strike}`,
        underlying_symbol: recommendation.symbol,
        expiration_date: leg.expirationDate,
        strike: leg.strike,
        contract_type: leg.type,
        bid: leg.bid,
        ask: leg.ask,
        last: leg.mid,
        volume: 0,
        open_interest: 0,
        implied_volatility: leg.impliedVolatility,
        delta: leg.delta,
        gamma: leg.gamma,
        theta: leg.theta,
        vega: null,
        captured_at: scan.completedAt
      }))
    );

    if (optionContracts.length) {
      await supabase.from("option_contracts").upsert(optionContracts, {
        onConflict: "symbol,captured_at",
        ignoreDuplicates: true
      });
    }
  }

  return {
    ...scan,
    scanId,
    recommendations: scan.recommendations.map((recommendation) => ({
      ...recommendation
    }))
  };
}

export async function getLatestRecommendations(limit = 10) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLatestStoredScan(): Promise<ScanResult | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = createSupabaseAdminClient();
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("*")
    .eq("status", "completed")
    .gt("recommendation_count", 0)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (scanError) throw new Error(scanError.message);
  if (!scan) return null;

  const { data: rows, error: recommendationsError } = await supabase
    .from("recommendations")
    .select("*")
    .eq("scan_id", scan.id)
    .order("confidence_score", { ascending: false })
    .limit(200);

  if (recommendationsError) throw new Error(recommendationsError.message);

  const recommendations = (rows ?? []).map((row, index) =>
    storedRecommendationToDomain(row, index + 1)
  );

  return {
    scanId: scan.id,
    scanDate: scan.scan_date,
    startedAt: scan.started_at,
    completedAt: scan.completed_at ?? scan.started_at,
    marketRegime: scan.market_regime as unknown as MarketRegime,
    universeCount: scan.universe_count,
    analyzedCount: recommendations.length,
    skippedCount: Math.max(0, scan.universe_count - recommendations.length),
    recommendations,
    warnings: []
  };
}
