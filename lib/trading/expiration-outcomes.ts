import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createMarketDataProvider } from "@/lib/trading/market-data";
import type { Json } from "@/lib/supabase/database.types";
import type { OptionLeg, UniverseGroup } from "@/lib/trading/types";

export type ExpirationStrategy = "cash_secured_put" | "covered_call";
export type AssignmentStatus =
  | "expired_without_assignment"
  | "put_assigned"
  | "shares_called_away";

export interface ExpirationEvaluation {
  assignmentStatus: AssignmentStatus;
  assignmentAvoided: boolean;
  premiumReceived: number;
  intrinsicValue: number;
  breakevenPrice: number;
  modeledPnl: number;
  modeledReturnPct: number;
}

export interface ExpirationOutcomeRecord extends ExpirationEvaluation {
  id: string;
  recommendationId: string;
  scanId: string;
  symbol: string;
  companyName: string;
  strategyType: ExpirationStrategy;
  universeGroup: string;
  recommendedAt: string;
  expirationDate: string;
  underlyingEntryPrice: number;
  underlyingExpirationPrice: number;
  strikePrice: number;
  optionCreditPerShare: number;
  probabilityOfProfit: number;
  confidenceScore: number;
  priceSource: string;
  evaluatedAt: string;
}

export interface ExpirationOutcomeReport {
  outcomes: ExpirationOutcomeRecord[];
  pendingCount: number;
  nextExpirationDate: string | null;
}

type RecommendationRow = {
  id: string;
  scan_id: string;
  symbol: string;
  company_name: string;
  strategy_type: string;
  entry: Json;
  option_legs: Json;
  probability_of_profit: number;
  confidence_score: number;
  created_at: string;
  expires_at: string;
};

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function evaluateExpirationOutcome(input: {
  strategyType: ExpirationStrategy;
  underlyingEntryPrice: number;
  expirationPrice: number;
  strikePrice: number;
  optionCreditPerShare: number;
}): ExpirationEvaluation {
  const {
    strategyType,
    underlyingEntryPrice,
    expirationPrice,
    strikePrice,
    optionCreditPerShare
  } = input;
  const isPut = strategyType === "cash_secured_put";
  const intrinsicPerShare = isPut
    ? Math.max(strikePrice - expirationPrice, 0)
    : Math.max(expirationPrice - strikePrice, 0);
  const isInTheMoney = intrinsicPerShare >= 0.01 - Number.EPSILON;
  const premiumReceived = optionCreditPerShare * 100;
  const intrinsicValue = intrinsicPerShare * 100;
  const modeledPnl = isPut
    ? premiumReceived - intrinsicValue
    : premiumReceived + (Math.min(expirationPrice, strikePrice) - underlyingEntryPrice) * 100;
  const capitalReference = (isPut ? strikePrice : underlyingEntryPrice) * 100;

  return {
    assignmentStatus: isInTheMoney
      ? isPut
        ? "put_assigned"
        : "shares_called_away"
      : "expired_without_assignment",
    assignmentAvoided: !isInTheMoney,
    premiumReceived: round(premiumReceived),
    intrinsicValue: round(intrinsicValue),
    breakevenPrice: round(
      isPut
        ? strikePrice - optionCreditPerShare
        : underlyingEntryPrice - optionCreditPerShare,
      4
    ),
    modeledPnl: round(modeledPnl),
    modeledReturnPct: round(capitalReference > 0 ? (modeledPnl / capitalReference) * 100 : 0, 4)
  };
}

function easternDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function objectValue(value: Json) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function optionLegs(value: Json) {
  return Array.isArray(value) ? (value as unknown as OptionLeg[]) : [];
}

function universeGroup(value: unknown): UniverseGroup {
  return ["nasdaq_100", "under_100", "admin_picks", "custom"].includes(String(value))
    ? (value as UniverseGroup)
    : "custom";
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
) {
  const output = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return output;
}

export function isEasternSettlementWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return (
    value("weekday") !== "Sat" &&
    value("weekday") !== "Sun" &&
    value("hour") === "16" &&
    value("minute") === "30"
  );
}

export async function settleExpiredRecommendations(now = new Date()) {
  const today = easternDate(now);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .rpc("get_pending_expiration_recommendations", {
      p_expiration_date: today,
      p_limit: 500
    });
  if (error) {
    throw new Error(
      `${error.message}. Apply migration 008_recommendation_expiration_outcomes.sql.`
    );
  }

  const candidates = ((data ?? []) as RecommendationRow[]).filter((row) => {
    const leg = optionLegs(row.option_legs).find((item) => item.action === "sell");
    return Boolean(leg && leg.expirationDate <= today);
  });
  if (!candidates.length) return { evaluated: 0, pendingPrices: 0, errors: [] as string[] };

  const pending = candidates;

  const provider = createMarketDataProvider();
  const priceKeys = Array.from(
    new Set(
      pending.map((row) => {
        const leg = optionLegs(row.option_legs).find((item) => item.action === "sell")!;
        return `${row.symbol}|${leg.expirationDate}`;
      })
    )
  );
  const errors: string[] = [];
  const prices = new Map<string, Awaited<ReturnType<typeof provider.getHistoricalClose>>>();
  await mapWithConcurrency(priceKeys, 5, async (key) => {
    const [symbol, date] = key.split("|");
    try {
      prices.set(key, await provider.getHistoricalClose(symbol, date));
    } catch (error) {
      errors.push(`${symbol} ${date}: ${error instanceof Error ? error.message : "price unavailable"}`);
      prices.set(key, null);
    }
  });

  const evaluatedAt = now.toISOString();
  const inserts = pending.flatMap((row) => {
    const entry = objectValue(row.entry);
    const leg = optionLegs(row.option_legs).find((item) => item.action === "sell");
    if (!leg) return [];
    const historicalClose = prices.get(`${row.symbol}|${leg.expirationDate}`);
    const underlyingEntryPrice = Number(entry.underlyingPrice ?? 0);
    if (!historicalClose || underlyingEntryPrice <= 0 || leg.mid <= 0 || leg.strike <= 0) return [];
    const strategyType = row.strategy_type as ExpirationStrategy;
    const evaluation = evaluateExpirationOutcome({
      strategyType,
      underlyingEntryPrice,
      expirationPrice: historicalClose.price,
      strikePrice: leg.strike,
      optionCreditPerShare: leg.mid
    });
    return [{
      recommendation_id: row.id,
      scan_id: row.scan_id,
      symbol: row.symbol,
      company_name: row.company_name,
      strategy_type: strategyType,
      universe_group: universeGroup(entry.universeGroup),
      recommended_at: row.created_at,
      expiration_date: leg.expirationDate,
      underlying_entry_price: underlyingEntryPrice,
      underlying_expiration_price: historicalClose.price,
      strike_price: leg.strike,
      option_credit_per_share: leg.mid,
      premium_received: evaluation.premiumReceived,
      intrinsic_value: evaluation.intrinsicValue,
      breakeven_price: evaluation.breakevenPrice,
      modeled_pnl: evaluation.modeledPnl,
      modeled_return_pct: evaluation.modeledReturnPct,
      assignment_status: evaluation.assignmentStatus,
      assignment_avoided: evaluation.assignmentAvoided,
      probability_of_profit: Number(row.probability_of_profit),
      confidence_score: row.confidence_score,
      price_source: historicalClose.source,
      evaluated_at: evaluatedAt
    }];
  });

  if (inserts.length) {
    const { error: insertError } = await supabase
      .from("recommendation_expiration_outcomes")
      .upsert(inserts, { onConflict: "recommendation_id", ignoreDuplicates: true });
    if (insertError) throw new Error(insertError.message);

    const recommendationIds = inserts.map((row) => row.recommendation_id);
    const { error: updateError } = await supabase
      .from("recommendations")
      .update({ status: "expired" })
      .in("id", recommendationIds)
      .eq("status", "open");
    if (updateError) errors.push(`Recommendation status update: ${updateError.message}`);
  }

  return {
    evaluated: inserts.length,
    pendingPrices: pending.length - inserts.length,
    errors
  };
}

function outcomeRowToDomain(row: Record<string, unknown>): ExpirationOutcomeRecord {
  return {
    id: String(row.id),
    recommendationId: String(row.recommendation_id),
    scanId: String(row.scan_id),
    symbol: String(row.symbol),
    companyName: String(row.company_name),
    strategyType: row.strategy_type as ExpirationStrategy,
    universeGroup: String(row.universe_group),
    recommendedAt: String(row.recommended_at),
    expirationDate: String(row.expiration_date),
    underlyingEntryPrice: Number(row.underlying_entry_price),
    underlyingExpirationPrice: Number(row.underlying_expiration_price),
    strikePrice: Number(row.strike_price),
    optionCreditPerShare: Number(row.option_credit_per_share),
    premiumReceived: Number(row.premium_received),
    intrinsicValue: Number(row.intrinsic_value),
    breakevenPrice: Number(row.breakeven_price),
    modeledPnl: Number(row.modeled_pnl),
    modeledReturnPct: Number(row.modeled_return_pct),
    assignmentStatus: row.assignment_status as AssignmentStatus,
    assignmentAvoided: Boolean(row.assignment_avoided),
    probabilityOfProfit: Number(row.probability_of_profit),
    confidenceScore: Number(row.confidence_score),
    priceSource: String(row.price_source),
    evaluatedAt: String(row.evaluated_at)
  };
}

export async function getExpirationOutcomeReport(): Promise<ExpirationOutcomeReport> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("recommendation_expiration_outcomes")
    .select("*")
    .order("expiration_date", { ascending: false })
    .order("recommended_at", { ascending: false })
    .limit(1000);
  if (error) {
    throw new Error(`${error.message}. Apply migration 008_recommendation_expiration_outcomes.sql.`);
  }

  const deduplicated = new Map<string, ExpirationOutcomeRecord>();
  for (const rawRow of data ?? []) {
    const row = outcomeRowToDomain(rawRow as Record<string, unknown>);
    const key = [row.scanId, row.symbol, row.strategyType, row.expirationDate, row.strikePrice].join("|");
    if (!deduplicated.has(key)) deduplicated.set(key, row);
  }

  const nowIso = new Date().toISOString();
  const { data: nextRows, count, error: pendingError } = await supabase
    .from("recommendations")
    .select("expires_at", { count: "exact" })
    .in("strategy_type", ["cash_secured_put", "covered_call"])
    .gt("expires_at", nowIso)
    .order("expires_at", { ascending: true })
    .limit(1);
  if (pendingError) throw new Error(pendingError.message);

  return {
    outcomes: Array.from(deduplicated.values()),
    pendingCount: count ?? 0,
    nextExpirationDate: nextRows?.[0]?.expires_at?.slice(0, 10) ?? null
  };
}

export function weekEndingFriday(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  const offset = (5 - value.getUTCDay() + 7) % 7;
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
