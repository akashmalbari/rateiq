import { Activity, Download, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { PaperEquityChart } from "@/components/charts/paper-equity-chart";
import { MetricTile } from "@/components/metric-tile";
import { PaperCapitalControl } from "@/components/paper-capital-control";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { numberValue, positionUnrealizedPnl } from "@/lib/paper-trading/accounting";
import { getPaperPortfolioReport } from "@/lib/paper-trading/reporting";
import { getCurrentUser } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function PaperPortfolioPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#0B0E14]">
        <SiteNav />
        <main className="container-shell py-10 text-slate-300">
          Configure Supabase to activate the automated paper portfolio.
        </main>
      </div>
    );
  }
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/paper");
  let canManageCapital = false;
  try {
    await requireAdmin();
    canManageCapital = true;
  } catch {
    canManageCapital = false;
  }

  let report: Awaited<ReturnType<typeof getPaperPortfolioReport>>;
  try {
    report = await getPaperPortfolioReport();
  } catch (error) {
    return (
      <div className="min-h-screen bg-[#0B0E14]">
        <SiteNav />
        <main className="container-shell py-10">
          <Badge variant="danger">Setup required</Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold text-white">Paper Portfolio</h1>
          <div className="mt-6 rounded-md border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
            {error instanceof Error ? error.message : "Paper portfolio data is unavailable."}
          </div>
        </main>
      </div>
    );
  }

  const returnTone = report.totalPnl >= 0 ? "green" : "red";
  const equityData = report.snapshots.map((snapshot) => ({
    date: snapshot.snapshot_date.slice(5),
    equity: numberValue(snapshot.equity),
    realized: numberValue(snapshot.realized_pnl_cumulative)
  }));
  const lastJob = report.lastJob as
    | { job_type: string; status: string; completed_at: string | null; started_at: string }
    | null;

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="success">Autonomous paper trading</Badge>
            <h1 className="mt-4 font-heading text-4xl font-bold tracking-normal text-white">
              {money(report.fundedCapital)} Paper Portfolio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Fully automated cash-secured puts and covered-call buy-writes. Entries run after the
              10:30 AM Eastern scan; open risk is checked every 15 minutes through 3:45 PM.
            </p>
          </div>
          <Button asChild variant="secondary">
            <a href="/api/paper/export">
              <Download aria-hidden="true" />
              Export CSV
            </a>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-white/10 py-4 text-xs text-slate-400">
          <span className="flex items-center gap-2 text-emerald-300">
            <Activity className="size-4" aria-hidden="true" />
            {report.account.status === "active" ? "Automation active" : report.account.status}
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-amber-300" aria-hidden="true" />
            No margin, no naked calls, no assignment
          </span>
          <span>Strategy {report.account.strategy_version}</span>
          <span>
            Last cycle {lastJob ? `${lastJob.job_type} ${lastJob.status} at ${dateTime(lastJob.completed_at ?? lastJob.started_at)}` : "not yet run"}
          </span>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Current Equity"
            value={money(report.values.equity)}
            detail={`${report.totalReturnPct >= 0 ? "+" : ""}${report.totalReturnPct.toFixed(2)}% on funded capital`}
            tone={returnTone}
          />
          <MetricTile
            label="Total P/L"
            value={money(report.totalPnl)}
            detail={`${money(report.realizedPnl)} realized`}
            tone={returnTone}
          />
          <MetricTile
            label="Available Cash"
            value={money(report.values.availableCash)}
            detail={`${money(report.values.reservedCollateral)} reserved`}
          />
          <MetricTile
            label="Open Risk"
            value={money(report.values.deployedCapital)}
            detail={`${report.openPositions.length} of 3 positions open`}
            tone="amber"
          />
        </section>

        {canManageCapital ? (
          <PaperCapitalControl
            availableCash={report.values.availableCash}
            netContributions={report.netContributions}
          />
        ) : null}

        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <PaperEquityChart data={equityData} />
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-white">Open Positions</h2>
            <span className="text-xs text-slate-500">Marked every 15 minutes</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-white/[0.035] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Strategy</th>
                  <th className="px-4 py-3">Contract</th>
                  <th className="px-4 py-3">Entry credit</th>
                  <th className="px-4 py-3">Current cost</th>
                  <th className="px-4 py-3">Capital</th>
                  <th className="px-4 py-3">Unrealized</th>
                  <th className="px-4 py-3">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {report.openPositions.map((position) => {
                  const pnl = positionUnrealizedPnl(position);
                  return (
                    <tr key={position.id}>
                      <td className="px-4 py-4 font-semibold text-white">{position.symbol}</td>
                      <td className="px-4 py-4">{position.strategy_type.replaceAll("_", " ")}</td>
                      <td className="px-4 py-4 font-mono text-xs">
                        {position.expiration_date} {numberValue(position.strike)} {position.option_type}
                      </td>
                      <td className="px-4 py-4">{money(numberValue(position.entry_option_price) * 100)}</td>
                      <td className="px-4 py-4">{money(numberValue(position.current_option_price) * 100)}</td>
                      <td className="px-4 py-4">{money(numberValue(position.capital_deployed))}</td>
                      <td className={`px-4 py-4 font-semibold ${pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {money(pnl)}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">{dateTime(position.opened_at)}</td>
                    </tr>
                  );
                })}
                {!report.openPositions.length ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={8}>
                      No open positions. The system will wait for an eligible, affordable setup.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Closed Trades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.closedPositions.slice(0, 8).map((position) => {
                const pnl = numberValue(position.realized_pnl);
                return (
                  <div key={position.id} className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/10 pb-3 text-sm last:border-0">
                    <div>
                      <p className="font-semibold text-white">
                        {position.symbol} <span className="font-normal text-slate-500">{position.strategy_type.replaceAll("_", " ")}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{position.close_reason} · {dateTime(position.closed_at)}</p>
                    </div>
                    <p className={pnl >= 0 ? "text-emerald-300" : "text-rose-300"}>{money(pnl)}</p>
                  </div>
                );
              })}
              {!report.closedPositions.length ? <p className="text-sm text-slate-500">No completed trades yet.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.months.map((month) => (
                <div key={month.month} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/10 pb-3 text-sm last:border-0">
                  <div>
                    <p className="font-semibold text-white">{month.month}</p>
                    <p className="mt-1 text-xs text-slate-500">{month.trades} trades · {month.winRate.toFixed(1)}% wins</p>
                  </div>
                  <span className="text-xs text-slate-500">{month.wins}W / {month.losses}L</span>
                  <span className={month.realizedPnl >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {money(month.realizedPnl)}
                  </span>
                </div>
              ))}
              {!report.months.length ? <p className="text-sm text-slate-500">Monthly results appear after the first position closes.</p> : null}
            </CardContent>
          </Card>
        </section>

        <p className="mt-8 text-xs leading-5 text-slate-600">
          Simulated fills use live market quotes with spread and slippage penalties. This is forward
          paper trading for research, not brokerage execution or financial advice.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
