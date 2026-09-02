import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ShieldCheck,
  TrendingUp,
  XCircle
} from "lucide-react";
import { redirect } from "next/navigation";
import { MetricTile } from "@/components/metric-tile";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  getExpirationOutcomeReport,
  weekEndingFriday,
  type ExpirationOutcomeRecord
} from "@/lib/trading/expiration-outcomes";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Filter = "all" | "safe" | "assignment";
type StrategyFilter = "all" | "cash_secured_put" | "covered_call";

function currency(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function statusLabel(outcome: ExpirationOutcomeRecord) {
  if (outcome.assignmentStatus === "put_assigned") return "Put assigned";
  if (outcome.assignmentStatus === "shares_called_away") return "Shares called away";
  return "Expired without assignment";
}

function filterHref(week: string, status: Filter, strategy: StrategyFilter) {
  const params = new URLSearchParams({ week, status, strategy });
  return `/track-record?${params.toString()}`;
}

export default async function TrackRecordPage({
  searchParams
}: {
  searchParams: Promise<{ week?: string; status?: string; strategy?: string }>;
}) {
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/track-record");
  }

  const params = await searchParams;
  let loadError = false;
  const report = await getExpirationOutcomeReport().catch(() => {
    loadError = true;
    return { outcomes: [], pendingCount: 0, nextExpirationDate: null };
  });
  const weeks = Array.from(new Set(report.outcomes.map((row) => weekEndingFriday(row.expirationDate))));
  const selectedWeek = weeks.includes(params.week ?? "") ? params.week! : weeks[0] ?? "";
  const status: Filter = ["safe", "assignment"].includes(params.status ?? "")
    ? (params.status as Filter)
    : "all";
  const strategy: StrategyFilter = ["cash_secured_put", "covered_call"].includes(params.strategy ?? "")
    ? (params.strategy as StrategyFilter)
    : "all";
  const weeklyOutcomes = report.outcomes.filter(
    (row) => weekEndingFriday(row.expirationDate) === selectedWeek
  );
  const visibleOutcomes = weeklyOutcomes.filter((row) => {
    if (status === "safe" && !row.assignmentAvoided) return false;
    if (status === "assignment" && row.assignmentAvoided) return false;
    return strategy === "all" || row.strategyType === strategy;
  });
  const avoided = weeklyOutcomes.filter((row) => row.assignmentAvoided).length;
  const puts = weeklyOutcomes.filter((row) => row.strategyType === "cash_secured_put");
  const calls = weeklyOutcomes.filter((row) => row.strategyType === "covered_call");
  const putAvoided = puts.filter((row) => row.assignmentAvoided).length;
  const callAvoided = calls.filter((row) => row.assignmentAvoided).length;
  const modeledPnl = weeklyOutcomes.reduce((sum, row) => sum + row.modeledPnl, 0);

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-8 sm:py-10">
        <Badge variant="blue">Verified at expiration</Badge>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Expiration Track Record
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Every published cash-secured put and covered call is checked against the
              underlying&apos;s expiration-day close. Assignment avoidance and modeled return
              are reported separately.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <CalendarClock className="size-4 text-sky-300" aria-hidden="true" />
            {report.pendingCount} predictions awaiting expiration
          </div>
        </div>

        {loadError ? (
          <div className="mt-7 rounded-md border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
            The expiration ledger is not available yet. Apply database migration 008, then
            allow the after-close settlement job to run.
          </div>
        ) : null}

        {!loadError && !weeks.length ? (
          <Card className="mt-8">
            <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
              <CalendarClock className="size-7 text-sky-300" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-white">
                No recommendations have reached expiration yet
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                {report.nextExpirationDate
                  ? `The next tracked expiration is ${dateLabel(report.nextExpirationDate)}. Its official close will be evaluated after the market closes.`
                  : "New recommendations will appear here after their first expiration-day settlement."}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {selectedWeek ? (
          <>
            <section className="mt-8 border-y border-white/10 py-5">
              <p className="data-label">Weekly report</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {weeks.slice(0, 10).map((week) => (
                  <Link
                    key={week}
                    href={filterHref(week, status, strategy)}
                    className={cn(
                      "shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      week === selectedWeek
                        ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
                        : "border-white/10 bg-white/[0.035] text-slate-300 hover:text-white"
                    )}
                  >
                    Week ending {dateLabel(week)}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricTile label="Evaluated" value={weeklyOutcomes.length} detail="Published ideas" />
              <MetricTile
                label="Assignment avoided"
                value={weeklyOutcomes.length ? `${((avoided / weeklyOutcomes.length) * 100).toFixed(1)}%` : "N/A"}
                detail={`${avoided} of ${weeklyOutcomes.length}`}
                tone="green"
              />
              <MetricTile
                label="Put safety"
                value={puts.length ? `${((putAvoided / puts.length) * 100).toFixed(1)}%` : "N/A"}
                detail={`${putAvoided} of ${puts.length} unassigned`}
                tone="blue"
              />
              <MetricTile
                label="Call retention"
                value={calls.length ? `${((callAvoided / calls.length) * 100).toFixed(1)}%` : "N/A"}
                detail={`${callAvoided} of ${calls.length} retained`}
                tone="blue"
              />
              <MetricTile
                label="Modeled P/L"
                value={currency(modeledPnl)}
                detail="One contract per idea"
                tone={modeledPnl >= 0 ? "green" : "red"}
              />
            </section>

            <section className="mt-8">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="data-label">Recommendation ledger</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-white">
                    Week ending {dateLabel(selectedWeek)}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "safe", "assignment"] as Filter[]).map((item) => (
                    <Link
                      key={item}
                      href={filterHref(selectedWeek, item, strategy)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-xs font-semibold capitalize",
                        status === item
                          ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                          : "border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      {item === "safe" ? "No assignment" : item}
                    </Link>
                  ))}
                  {(["all", "cash_secured_put", "covered_call"] as StrategyFilter[]).map((item) => (
                    <Link
                      key={item}
                      href={filterHref(selectedWeek, status, item)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-xs font-semibold",
                        strategy === item
                          ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                          : "border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      {item === "all" ? "Both strategies" : item === "cash_secured_put" ? "Puts" : "Calls"}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {visibleOutcomes.map((outcome) => (
                  <article
                    key={outcome.id}
                    className="rounded-lg border border-white/10 bg-[#151A22]/80 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 xl:w-56">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-xl font-bold text-white">{outcome.symbol}</h3>
                          <Badge variant={outcome.assignmentAvoided ? "success" : "danger"}>
                            {outcome.assignmentAvoided ? (
                              <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                            ) : (
                              <XCircle className="mr-1 size-3" aria-hidden="true" />
                            )}
                            {statusLabel(outcome)}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500">{outcome.companyName}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {outcome.strategyType === "cash_secured_put" ? "Cash-secured put" : "Covered call"}
                          {" · published "}{dateLabel(outcome.recommendedAt.slice(0, 10))}
                        </p>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 xl:grid-cols-7">
                        <div><p className="data-label">Expiration</p><p className="mt-1 font-mono text-sm text-white">{outcome.expirationDate}</p></div>
                        <div><p className="data-label">Entry stock</p><p className="mt-1 font-mono text-sm text-slate-200">{currency(outcome.underlyingEntryPrice, 2)}</p></div>
                        <div><p className="data-label">Expiry close</p><p className="mt-1 font-mono text-sm text-sky-300">{currency(outcome.underlyingExpirationPrice, 2)}</p></div>
                        <div><p className="data-label">Strike</p><p className="mt-1 font-mono text-sm text-amber-200">{currency(outcome.strikePrice, 2)}</p></div>
                        <div><p className="data-label">Credit</p><p className="mt-1 font-mono text-sm text-emerald-300">{currency(outcome.premiumReceived)}</p></div>
                        <div><p className="data-label">Predicted POP</p><p className="mt-1 font-mono text-sm text-slate-200">{outcome.probabilityOfProfit.toFixed(1)}%</p></div>
                        <div>
                          <p className="data-label">Modeled P/L</p>
                          <p className={cn("mt-1 font-mono text-sm", outcome.modeledPnl >= 0 ? "text-emerald-300" : "text-rose-300")}>
                            {currency(outcome.modeledPnl)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {!visibleOutcomes.length ? (
                  <div className="rounded-md border border-white/10 p-8 text-center text-sm text-slate-400">
                    No outcomes match these filters for this week.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-8 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-3">
              <div className="flex gap-3 text-sm leading-6 text-slate-400">
                <ShieldCheck className="mt-1 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                <p><span className="font-semibold text-slate-200">Assignment avoided</span> means the option was not at least $0.01 in the money at the recorded close.</p>
              </div>
              <div className="flex gap-3 text-sm leading-6 text-slate-400">
                <CircleDollarSign className="mt-1 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                <p><span className="font-semibold text-slate-200">Credit</span> uses the published midpoint for one 100-share contract, not a guaranteed execution fill.</p>
              </div>
              <div className="flex gap-3 text-sm leading-6 text-slate-400">
                <TrendingUp className="mt-1 size-4 shrink-0 text-sky-300" aria-hidden="true" />
                <p><span className="font-semibold text-slate-200">Modeled P/L</span> includes intrinsic value for puts and the 100-share covered position for calls.</p>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
