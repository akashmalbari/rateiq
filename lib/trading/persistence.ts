import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Recommendation, ScanResult } from "@/lib/trading/types";

function recommendationToInsert(scanId: string, recommendation: Recommendation) {
  return {
    scan_id: scanId,
    symbol: recommendation.symbol,
    company_name: recommendation.companyName,
    strategy_type: recommendation.strategyType,
    entry: {
      recommendation: recommendation.entryRecommendation,
      plan: recommendation.tradePlan.entry,
      underlyingPrice: recommendation.underlyingPrice
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
