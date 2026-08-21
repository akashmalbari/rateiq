"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, ListFilter, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/metric-tile";
import type { BacktestMetrics, BacktestTrade } from "@/lib/trading/types";
import { cn } from "@/lib/utils";

const strategies = [
  "buy_call",
  "sell_call",
  "buy_put",
  "sell_put",
  "cash_secured_put",
  "covered_call",
  "bull_put_credit_spread",
  "bear_call_credit_spread",
  "bull_call_debit_spread",
  "bear_put_debit_spread",
  "iron_condor",
  "directional_call",
  "directional_put"
];

type TradeFilter = "all" | "wins" | "losses";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "2-digit",
  timeZone: "UTC"
});

function formatSignedCurrency(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${currencyFormatter.format(Math.abs(value))}`;
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function TradeResultBadge({ winner }: { winner: boolean }) {
  return (
    <Badge variant={winner ? "success" : "danger"} className="gap-1.5 whitespace-nowrap">
      {winner ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
      {winner ? "Won" : "Lost"}
    </Badge>
  );
}

function MobileTradeRow({ trade, sequence }: { trade: BacktestTrade; sequence: number }) {
  return (
    <article className="space-y-4 border-t border-white/10 p-4 first:border-t-0 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">#{sequence}</span>
          <TradeResultBadge winner={trade.winner} />
        </div>
        <p
          className={cn(
            "font-mono text-sm font-semibold",
            trade.winner ? "text-emerald-300" : "text-rose-300"
          )}
        >
          {formatSignedCurrency(trade.pnl)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="data-label">Period</p>
          <p className="mt-1 text-slate-300">{formatDate(trade.openedAt)} - {formatDate(trade.closedAt)}</p>
        </div>
        <div>
          <p className="data-label">Return</p>
          <p className={cn("mt-1 font-mono", trade.winner ? "text-emerald-300" : "text-rose-300")}>
            {formatSignedPercent(trade.pnlPct)}
          </p>
        </div>
        <div>
          <p className="data-label">Underlying ref.</p>
          <p className="mt-1 font-mono text-slate-300">${trade.entryPrice.toFixed(2)} to ${trade.exitPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="data-label">Equity after</p>
          <p className="mt-1 font-mono text-slate-300">{currencyFormatter.format(trade.equityAfter)}</p>
        </div>
      </div>
      <div>
        <p className="data-label">Outcome analysis</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{trade.outcomeReason}</p>
      </div>
    </article>
  );
}

function TradeLedger({ metrics }: { metrics: BacktestMetrics }) {
  const [filter, setFilter] = useState<TradeFilter>("all");
  const filteredTrades = metrics.tradeHistory.filter((trade) => {
    if (filter === "wins") return trade.winner;
    if (filter === "losses") return !trade.winner;
    return true;
  });
  const filters: Array<{ key: TradeFilter; label: string; count: number; icon: typeof ListFilter }> = [
    { key: "all", label: "All trades", count: metrics.trades, icon: ListFilter },
    { key: "wins", label: "Winners", count: metrics.wins, icon: CheckCircle2 },
    { key: "losses", label: "Losses", count: metrics.losses, icon: XCircle }
  ];

  return (
    <section className="premium-panel overflow-hidden" aria-labelledby="trade-ledger-title">
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="data-label">Result attribution</p>
            <h2 id="trade-ledger-title" className="mt-2 font-heading text-xl font-semibold text-white">
              Complete simulated trade ledger
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Review every trade behind the summary. Outcome analysis identifies the modeled
              condition that drove each win or loss.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-[#0B0E14] p-1" aria-label="Filter trade results">
            {filters.map(({ key, label, count, icon: Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex min-h-9 items-center justify-center gap-1.5 rounded px-2 text-xs font-semibold transition-colors sm:px-3",
                  filter === key
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                )}
              >
                <Icon className="hidden size-3.5 sm:block" />
                <span>{label}</span>
                <span className="font-mono text-[11px] text-slate-500">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr className="data-label">
              <th className="px-5 py-3"># / Result</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Underlying ref.</th>
              <th className="px-4 py-3 text-right">P/L</th>
              <th className="px-4 py-3 text-right">Return</th>
              <th className="px-4 py-3 text-right">Equity after</th>
              <th className="px-5 py-3">Outcome analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredTrades.map((trade) => {
              const sequence = metrics.tradeHistory.indexOf(trade) + 1;
              return (
                <tr key={`${trade.openedAt}-${sequence}`} className="align-top hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">#{sequence}</span>
                      <TradeResultBadge winner={trade.winner} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs leading-5 text-slate-300">
                    <p>{formatDate(trade.openedAt)}</p>
                    <p className="text-slate-500">to {formatDate(trade.closedAt)}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-300">
                    ${trade.entryPrice.toFixed(2)} <span className="text-slate-600">to</span> ${trade.exitPrice.toFixed(2)}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-4 py-4 text-right font-mono font-semibold",
                      trade.winner ? "text-emerald-300" : "text-rose-300"
                    )}
                  >
                    {formatSignedCurrency(trade.pnl)}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-4 py-4 text-right font-mono text-xs",
                      trade.winner ? "text-emerald-300" : "text-rose-300"
                    )}
                  >
                    {formatSignedPercent(trade.pnlPct)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-xs text-slate-300">
                    {currencyFormatter.format(trade.equityAfter)}
                  </td>
                  <td className="max-w-sm px-5 py-4 text-xs leading-5 text-slate-400">
                    {trade.outcomeReason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        {filteredTrades.map((trade) => (
          <MobileTradeRow
            key={`${trade.openedAt}-${metrics.tradeHistory.indexOf(trade)}`}
            trade={trade}
            sequence={metrics.tradeHistory.indexOf(trade) + 1}
          />
        ))}
      </div>

      <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3 text-xs leading-5 text-slate-500">
        Reference prices and explanations come from the lightweight statistical model. They are
        not a replay of historical option-chain fills.
      </div>
    </section>
  );
}

export function BacktestConsole() {
  const [strategyType, setStrategyType] = useState(strategies[0]);
  const [symbol, setSymbol] = useState("QQQ");
  const [metrics, setMetrics] = useState<BacktestMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/backtests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyType, symbol: symbol.trim().toUpperCase() })
      });
      const body = await response.json();
      if (response.ok) setMetrics(body.metrics);
      else setError(body.error);
    } catch {
      setError("Unable to run the backtest. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="blue">Backtesting</Badge>
        <h1 className="mt-4 font-heading text-4xl font-bold text-white">Lightweight strategy lab</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Run a fast statistical simulation for strategy triage. Full historical option-chain replay can be connected through the same results schema.
        </p>
      </div>

      <div className="premium-panel grid gap-4 p-5 md:grid-cols-[1fr_0.6fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="strategy">Strategy</Label>
          <select
            id="strategy"
            className="h-10 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 text-sm text-slate-100"
            value={strategyType}
            onChange={(event) => setStrategyType(event.target.value)}
          >
            {strategies.map((strategy) => (
              <option key={strategy} value={strategy}>{strategy.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input id="symbol" value={symbol} onChange={(event) => setSymbol(event.target.value)} />
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Calculator />}
          Run
        </Button>
      </div>

      {error ? <div className="rounded-md border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</div> : null}

      {metrics ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile label="Trades" value={metrics.trades} detail="Every result is listed below." />
            <MetricTile
              label="Win rate"
              value={`${metrics.winRate}%`}
              detail={`${metrics.wins} winners / ${metrics.losses} losses`}
              tone="green"
            />
            <MetricTile
              label="Sharpe"
              value={metrics.sharpeRatio}
              detail="Risk-adjusted consistency; above 1 is generally stronger."
              tone="blue"
            />
            <MetricTile
              label="Max drawdown"
              value={`${metrics.maxDrawdown}%`}
              detail="Largest peak-to-trough equity decline."
              tone="red"
            />
            <MetricTile
              label="Profit factor"
              value={metrics.profitFactor}
              detail={`$${metrics.profitFactor} gross profit per $1.00 gross loss.`}
              tone="amber"
            />
            <MetricTile
              label="Expectancy"
              value={formatSignedCurrency(metrics.expectancy)}
              detail="Average dollar P/L per simulated trade."
            />
          </div>
          <TradeLedger
            key={`${metrics.tradeHistory[0]?.symbol}-${metrics.tradeHistory[0]?.strategyType}`}
            metrics={metrics}
          />
        </div>
      ) : null}
    </div>
  );
}
