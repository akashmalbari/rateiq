import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  PAPER_ACCOUNT_SLUG,
  PAPER_RULES,
  PAPER_STRATEGY_PARAMETERS
} from "@/lib/paper-trading/config";
import {
  buyOptionFill,
  buyUnderlyingFill,
  daysToExpiration,
  findPositionContract,
  numberValue,
  portfolioValues,
  positionUnrealizedPnl,
  sellOptionFill,
  sellUnderlyingFill
} from "@/lib/paper-trading/accounting";
import type {
  PaperAccount,
  PaperCycleResult,
  PaperPosition,
  PaperRecommendationRow
} from "@/lib/paper-trading/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createMarketDataProvider } from "@/lib/trading/market-data";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

function easternClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));

  return {
    weekday: value("weekday"),
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour,
    minute,
    minutesSinceMidnight: hour * 60 + minute
  };
}

export function isEasternPaperMonitorWindow(now = new Date()) {
  const clock = easternClock(now);
  return (
    clock.weekday !== "Sat" &&
    clock.weekday !== "Sun" &&
    clock.minutesSinceMidnight >= 10 * 60 + 45 &&
    clock.minutesSinceMidnight <= 15 * 60 + 45
  );
}

async function getAccount(supabase: SupabaseAdmin) {
  const { data, error } = await supabase
    .from("paper_accounts")
    .select("*")
    .eq("slug", PAPER_ACCOUNT_SLUG)
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ?? "Paper account is missing. Apply migration 004_automated_paper_portfolio.sql."
    );
  }
  return data as PaperAccount;
}

async function getOpenPositions(supabase: SupabaseAdmin, accountId: string) {
  const { data, error } = await supabase
    .from("paper_positions")
    .select("*")
    .eq("account_id", accountId)
    .eq("status", "open")
    .order("opened_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PaperPosition[];
}

async function acquireJob(
  supabase: SupabaseAdmin,
  accountId: string,
  jobKey: string,
  jobType: "entry" | "monitor" | "snapshot"
) {
  const { data, error } = await supabase
    .from("paper_job_runs")
    .insert({ account_id: accountId, job_key: jobKey, job_type: jobType, status: "running" })
    .select("id")
    .single();

  if (error?.code === "23505") return null;
  if (error || !data) throw new Error(error?.message ?? "Unable to acquire paper job lock.");
  return data.id as string;
}

async function finishJob(
  supabase: SupabaseAdmin,
  jobId: string,
  status: "completed" | "failed",
  details: Record<string, unknown>
) {
  const { error } = await supabase
    .from("paper_job_runs")
    .update({ status, details, completed_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) logger.error("Unable to finalize paper job", { jobId, error: error.message });
}

function interleaveCandidates(rows: PaperRecommendationRow[]) {
  const sorted = [...rows].sort(
    (a, b) => b.confidence_score - a.confidence_score || Number(b.probability_of_profit) - Number(a.probability_of_profit)
  );
  const puts = sorted.filter((row) => row.strategy_type === "cash_secured_put");
  const calls = sorted.filter((row) => row.strategy_type === "covered_call");
  const first = (puts[0]?.confidence_score ?? 0) >= (calls[0]?.confidence_score ?? 0) ? puts : calls;
  const second = first === puts ? calls : puts;
  const output: PaperRecommendationRow[] = [];
  const count = Math.max(first.length, second.length);
  for (let index = 0; index < count; index += 1) {
    if (first[index]) output.push(first[index]);
    if (second[index]) output.push(second[index]);
  }
  return output;
}

async function recordSkippedOrder(
  supabase: SupabaseAdmin,
  account: PaperAccount,
  recommendation: PaperRecommendationRow,
  reason: string
) {
  await supabase.from("paper_orders").upsert(
    {
      account_id: account.id,
      recommendation_id: recommendation.id,
      idempotency_key: `open:${recommendation.id}`,
      action: "open",
      symbol: recommendation.symbol,
      strategy_type: recommendation.strategy_type,
      status: "skipped",
      reason,
      option_quantity: -1,
      underlying_quantity: recommendation.strategy_type === "covered_call" ? 100 : 0
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true }
  );
}

export async function createPaperSnapshot(
  supabase: SupabaseAdmin,
  account: PaperAccount,
  now = new Date()
) {
  const positions = await getOpenPositions(supabase, account.id);
  const currentAccount = await getAccount(supabase);
  const values = portfolioValues(currentAccount, positions);
  const { data: closed, error: closedError } = await supabase
    .from("paper_positions")
    .select("realized_pnl")
    .eq("account_id", account.id)
    .eq("status", "closed");
  if (closedError) throw new Error(closedError.message);
  const realizedPnl = (closed ?? []).reduce(
    (sum, position) => sum + numberValue(position.realized_pnl),
    0
  );
  const snapshotDate = easternClock(now).date;
  const { error } = await supabase.from("paper_daily_snapshots").upsert(
    {
      account_id: account.id,
      snapshot_date: snapshotDate,
      cash_balance: values.cashBalance,
      available_cash: values.availableCash,
      reserved_collateral: values.reservedCollateral,
      stock_market_value: values.stockMarketValue,
      option_liability: values.optionLiability,
      equity: values.equity,
      realized_pnl_cumulative: realizedPnl,
      unrealized_pnl: values.unrealizedPnl,
      net_contributions: numberValue(currentAccount.net_contributions),
      open_position_count: positions.length,
      created_at: now.toISOString()
    },
    { onConflict: "account_id,snapshot_date" }
  );
  if (error) throw new Error(error.message);
  return values;
}

export async function openPaperPositionsForScan(scanId: string): Promise<PaperCycleResult> {
  if (!isSupabaseConfigured) {
    return { skipped: true, reason: "Supabase is not configured." };
  }

  const supabase = createSupabaseAdminClient();
  const account = await getAccount(supabase);
  if (account.status !== "active") return { skipped: true, reason: "Paper account is not active." };
  const clock = easternClock();
  const jobId = await acquireJob(supabase, account.id, `entry:${clock.date}`, "entry");
  if (!jobId) return { skipped: true, reason: "Today's paper entry cycle already ran." };

  let opened = 0;
  const errors: string[] = [];
  try {
    const { data, error } = await supabase
      .from("recommendations")
      .select("id,symbol,strategy_type,confidence_score,probability_of_profit,option_legs,warnings,created_at")
      .eq("scan_id", scanId)
      .in("strategy_type", ["cash_secured_put", "covered_call"]);
    if (error) throw new Error(error.message);

    const recommendations = interleaveCandidates((data ?? []) as PaperRecommendationRow[]);
    let positions = await getOpenPositions(supabase, account.id);
    let currentAccount = await getAccount(supabase);
    let values = portfolioValues(currentAccount, positions);
    const symbols = new Set(positions.map((position) => position.symbol));
    const provider = createMarketDataProvider();

    for (const recommendation of recommendations) {
      if (positions.length >= PAPER_RULES.maxOpenPositions) break;
      if (symbols.has(recommendation.symbol)) continue;
      const earningsWarning = recommendation.warnings.some((warning) =>
        warning.toLowerCase().includes("earnings are")
      );
      if (earningsWarning) {
        await recordSkippedOrder(supabase, account, recommendation, "Skipped because earnings risk is present.");
        continue;
      }

      const leg = recommendation.option_legs.find((optionLeg) => optionLeg.action === "sell");
      if (!leg || leg.bid <= 0 || leg.ask < leg.bid) {
        await recordSkippedOrder(supabase, account, recommendation, "No executable short option leg.");
        continue;
      }

      try {
        const quote = await provider.getQuote(recommendation.symbol);
        const optionPrice = sellOptionFill(leg.bid, leg.ask);
        const underlyingPrice = buyUnderlyingFill(quote.price);
        const underlyingQuantity = recommendation.strategy_type === "covered_call" ? 100 : 0;
        const collateral = recommendation.strategy_type === "cash_secured_put" ? leg.strike * 100 : 0;
        const capital = recommendation.strategy_type === "cash_secured_put" ? collateral : underlyingPrice * 100;
        const premium = optionPrice * 100;
        const projectedCash =
          values.cashBalance - underlyingPrice * underlyingQuantity + premium - PAPER_RULES.optionFeePerContract;
        const projectedReserved = values.reservedCollateral + collateral;

        let rejection: string | null = null;
        if (capital > values.equity * PAPER_RULES.maxPositionEquityPct) {
          rejection = "Capital requirement exceeds the 40% per-position limit.";
        } else if (values.deployedCapital + capital > values.equity * PAPER_RULES.maxDeployedEquityPct) {
          rejection = "Portfolio would exceed the 80% deployed-capital limit.";
        } else if (projectedCash - projectedReserved < 0) {
          rejection = "Insufficient unreserved paper cash.";
        }

        if (rejection) {
          await recordSkippedOrder(supabase, account, recommendation, rejection);
          continue;
        }

        const { data: positionId, error: openError } = await supabase.rpc("execute_paper_open", {
          p_account_id: account.id,
          p_recommendation_id: recommendation.id,
          p_idempotency_key: `open:${recommendation.id}`,
          p_symbol: recommendation.symbol,
          p_strategy_type: recommendation.strategy_type,
          p_option_type: leg.type,
          p_strike: leg.strike,
          p_expiration_date: leg.expirationDate,
          p_underlying_quantity: underlyingQuantity,
          p_option_price: optionPrice,
          p_underlying_price: underlyingPrice,
          p_greeks: { delta: leg.delta, gamma: leg.gamma, theta: leg.theta },
          p_collateral_reserved: collateral,
          p_capital_deployed: capital,
          p_strategy_version: account.strategy_version,
          p_strategy_parameters: PAPER_STRATEGY_PARAMETERS,
          p_fees: PAPER_RULES.optionFeePerContract
        });
        if (openError || !positionId) throw new Error(openError?.message ?? "Atomic paper open failed.");

        opened += 1;
        symbols.add(recommendation.symbol);
        positions = await getOpenPositions(supabase, account.id);
        currentAccount = await getAccount(supabase);
        values = portfolioValues(currentAccount, positions);
      } catch (error) {
        const message = `${recommendation.symbol}: ${error instanceof Error ? error.message : "open failed"}`;
        errors.push(message);
        logger.error("Paper position open failed", { message });
      }
    }

    await createPaperSnapshot(supabase, account);
    await finishJob(supabase, jobId, "completed", { opened, errors });
    return { skipped: false, opened, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paper entry cycle failed.";
    await finishJob(supabase, jobId, "failed", { error: message, opened });
    throw error;
  }
}

export function determinePaperCloseReason(
  position: PaperPosition,
  optionClosePrice: number,
  unrealizedPnl: number,
  earningsDate: string | null,
  now: Date
) {
  const entryPrice = numberValue(position.entry_option_price);
  if (unrealizedPnl <= -numberValue(position.capital_deployed) * PAPER_RULES.maxPositionLossPct) {
    return "Whole-position loss reached the 8% capital stop";
  }
  if (optionClosePrice <= entryPrice * (1 - PAPER_RULES.profitTargetPct)) {
    return "50% premium profit target reached";
  }
  if (optionClosePrice >= entryPrice * PAPER_RULES.stopMultiple) {
    return "Option premium reached the 2x risk stop";
  }
  if (daysToExpiration(position.expiration_date, now) <= PAPER_RULES.timeExitDte) {
    return "Time exit at 7 DTE";
  }
  if (earningsDate) {
    const daysToEarnings = daysToExpiration(earningsDate, now);
    if (daysToEarnings >= 0 && daysToEarnings <= PAPER_RULES.earningsExitDays) {
      return "Earnings risk exit";
    }
  }
  return null;
}

export async function runPaperMonitoringCycle(now = new Date()): Promise<PaperCycleResult> {
  if (!isSupabaseConfigured) return { skipped: true, reason: "Supabase is not configured." };
  if (process.env.NODE_ENV === "production" && !isEasternPaperMonitorWindow(now)) {
    return { skipped: true, reason: "Outside the 10:45 AM-3:45 PM Eastern monitor window." };
  }

  const supabase = createSupabaseAdminClient();
  const account = await getAccount(supabase);
  if (account.status !== "active") return { skipped: true, reason: "Paper account is not active." };
  const clock = easternClock(now);
  const bucketMinute = Math.floor(clock.minute / 15) * 15;
  const jobKey = `monitor:${clock.date}:${String(clock.hour).padStart(2, "0")}:${String(bucketMinute).padStart(2, "0")}`;
  const jobId = await acquireJob(supabase, account.id, jobKey, "monitor");
  if (!jobId) return { skipped: true, reason: "This 15-minute monitor cycle already ran." };

  let marked = 0;
  let closed = 0;
  const errors: string[] = [];
  try {
    const positions = await getOpenPositions(supabase, account.id);
    const provider = createMarketDataProvider();
    for (const position of positions) {
      try {
        const [quote, chain, earnings] = await Promise.all([
          provider.getQuote(position.symbol),
          provider.getOptionsChain(position.symbol),
          provider.getEarningsDate(position.symbol)
        ]);
        const contract = findPositionContract(position, chain.contracts);
        if (!contract || contract.bid < 0 || contract.ask <= 0) {
          throw new Error("Matching live option contract is unavailable.");
        }
        const optionPrice = buyOptionFill(contract.bid, contract.ask);
        const unrealizedPnl = positionUnrealizedPnl(position, optionPrice, quote.price);
        const greeks = {
          delta: contract.delta,
          gamma: contract.gamma,
          theta: contract.theta,
          vega: contract.vega,
          impliedVolatility: contract.impliedVolatility
        };

        const { error: markError } = await supabase.from("paper_position_marks").insert({
          account_id: account.id,
          position_id: position.id,
          marked_at: now.toISOString(),
          underlying_price: quote.price,
          option_price: optionPrice,
          unrealized_pnl: unrealizedPnl,
          greeks
        });
        if (markError) throw new Error(markError.message);
        const { error: positionError } = await supabase
          .from("paper_positions")
          .update({
            current_option_price: optionPrice,
            current_underlying_price: quote.price,
            current_greeks: greeks
          })
          .eq("id", position.id)
          .eq("status", "open");
        if (positionError) throw new Error(positionError.message);
        marked += 1;

        const reason = determinePaperCloseReason(
          position,
          optionPrice,
          unrealizedPnl,
          earnings.date,
          now
        );
        if (reason) {
          const underlyingExit =
            position.underlying_quantity === 100 ? sellUnderlyingFill(quote.price) : quote.price;
          const { error: closeError } = await supabase.rpc("execute_paper_close", {
            p_account_id: account.id,
            p_position_id: position.id,
            p_idempotency_key: `close:${position.id}`,
            p_option_price: optionPrice,
            p_underlying_price: underlyingExit,
            p_greeks: greeks,
            p_close_reason: reason,
            p_fees: PAPER_RULES.optionFeePerContract
          });
          if (closeError) throw new Error(closeError.message);
          closed += 1;
        }
      } catch (error) {
        const message = `${position.symbol}: ${error instanceof Error ? error.message : "monitor failed"}`;
        errors.push(message);
        logger.error("Paper position monitor failed", { message });
      }
    }

    await createPaperSnapshot(supabase, account, now);
    await finishJob(supabase, jobId, "completed", { marked, closed, errors });
    return { skipped: false, marked, closed, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paper monitor failed.";
    await finishJob(supabase, jobId, "failed", { error: message, marked, closed });
    throw error;
  }
}
