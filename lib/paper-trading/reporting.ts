import { numberValue, portfolioValues } from "@/lib/paper-trading/accounting";
import { PAPER_ACCOUNT_SLUG } from "@/lib/paper-trading/config";
import type { PaperAccount, PaperPosition } from "@/lib/paper-trading/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface PaperSnapshot {
  snapshot_date: string;
  cash_balance: number | string;
  available_cash: number | string;
  reserved_collateral: number | string;
  stock_market_value: number | string;
  option_liability: number | string;
  equity: number | string;
  realized_pnl_cumulative: number | string;
  unrealized_pnl: number | string;
  net_contributions: number | string;
  open_position_count: number;
}

export interface PaperOrder {
  id: string;
  action: "open" | "close";
  symbol: string;
  strategy_type: string;
  status: "pending" | "filled" | "rejected" | "skipped";
  reason: string | null;
  option_price: number | string | null;
  underlying_price: number | string | null;
  fees: number | string;
  created_at: string;
  filled_at: string | null;
}

export interface PaperMonth {
  month: string;
  trades: number;
  wins: number;
  losses: number;
  realizedPnl: number;
  winRate: number;
}

export function calculatePaperPerformance(account: PaperAccount, equity: number) {
  const netContributions = numberValue(account.net_contributions);
  const fundedCapital = numberValue(account.starting_cash) + netContributions;
  const totalPnl = Number((equity - fundedCapital).toFixed(2));
  return {
    netContributions,
    fundedCapital,
    totalPnl,
    totalReturnPct: (totalPnl / Math.max(fundedCapital, 1)) * 100
  };
}

export async function getPaperPortfolioReport() {
  const supabase = createSupabaseAdminClient();
  const { data: accountData, error: accountError } = await supabase
    .from("paper_accounts")
    .select("*")
    .eq("slug", PAPER_ACCOUNT_SLUG)
    .single();
  if (accountError || !accountData) {
    throw new Error(
      accountError?.message ?? "Paper account is missing. Apply migration 004_automated_paper_portfolio.sql."
    );
  }
  const account = accountData as PaperAccount;

  const [positionsResult, snapshotsResult, ordersResult, jobsResult] = await Promise.all([
    supabase
      .from("paper_positions")
      .select("*")
      .eq("account_id", account.id)
      .order("opened_at", { ascending: false })
      .limit(500),
    supabase
      .from("paper_daily_snapshots")
      .select("*")
      .eq("account_id", account.id)
      .order("snapshot_date", { ascending: true })
      .limit(500),
    supabase
      .from("paper_orders")
      .select("id,action,symbol,strategy_type,status,reason,option_price,underlying_price,fees,created_at,filled_at")
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("paper_job_runs")
      .select("job_type,status,completed_at,started_at,details")
      .eq("account_id", account.id)
      .order("started_at", { ascending: false })
      .limit(1)
  ]);

  const error = positionsResult.error ?? snapshotsResult.error ?? ordersResult.error ?? jobsResult.error;
  if (error) throw new Error(error.message);

  const positions = (positionsResult.data ?? []) as PaperPosition[];
  const openPositions = positions.filter((position) => position.status === "open");
  const closedPositions = positions.filter((position) => position.status === "closed");
  const snapshots = (snapshotsResult.data ?? []) as PaperSnapshot[];
  const orders = (ordersResult.data ?? []) as PaperOrder[];
  const values = portfolioValues(account, openPositions);
  const realizedPnl = closedPositions.reduce(
    (sum, position) => sum + numberValue(position.realized_pnl),
    0
  );
  const performance = calculatePaperPerformance(account, values.equity);

  const monthMap = new Map<string, PaperMonth>();
  for (const position of closedPositions) {
    if (!position.closed_at) continue;
    const month = position.closed_at.slice(0, 7);
    const pnl = numberValue(position.realized_pnl);
    const current = monthMap.get(month) ?? {
      month,
      trades: 0,
      wins: 0,
      losses: 0,
      realizedPnl: 0,
      winRate: 0
    };
    current.trades += 1;
    current.wins += pnl > 0 ? 1 : 0;
    current.losses += pnl < 0 ? 1 : 0;
    current.realizedPnl += pnl;
    current.winRate = current.trades ? (current.wins / current.trades) * 100 : 0;
    monthMap.set(month, current);
  }

  return {
    account,
    values,
    ...performance,
    realizedPnl,
    openPositions,
    closedPositions,
    snapshots,
    orders,
    months: [...monthMap.values()].sort((a, b) => b.month.localeCompare(a.month)),
    lastJob: jobsResult.data?.[0] ?? null
  };
}

function csvValue(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function buildPaperTradesCsv() {
  const report = await getPaperPortfolioReport();
  const header = [
    "symbol",
    "strategy",
    "status",
    "opened_at",
    "closed_at",
    "expiration",
    "strike",
    "entry_underlying",
    "exit_or_current_underlying",
    "entry_option_credit",
    "exit_or_current_option_cost",
    "capital_deployed",
    "realized_pnl",
    "close_reason",
    "strategy_version"
  ];
  const rows = [...report.openPositions, ...report.closedPositions].map((position) => [
    position.symbol,
    position.strategy_type,
    position.status,
    position.opened_at,
    position.closed_at,
    position.expiration_date,
    numberValue(position.strike),
    numberValue(position.entry_underlying_price),
    numberValue(position.current_underlying_price),
    numberValue(position.entry_option_price),
    numberValue(position.current_option_price),
    numberValue(position.capital_deployed),
    position.realized_pnl == null ? "" : numberValue(position.realized_pnl),
    position.close_reason,
    position.strategy_version
  ]);
  return [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}
