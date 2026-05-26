"use client";

import { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "@/components/metric-tile";

const strategies = [
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

type Metrics = {
  trades: number;
  winRate: number;
  averageReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  expectancy: number;
};

export function BacktestConsole() {
  const [strategyType, setStrategyType] = useState(strategies[0]);
  const [symbol, setSymbol] = useState("QQQ");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/backtests/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyType, symbol: symbol.toUpperCase() })
    });
    const body = await response.json();
    if (response.ok) setMetrics(body.metrics);
    else setError(body.error);
    setLoading(false);
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
        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Trades" value={metrics.trades} />
          <MetricTile label="Win rate" value={`${metrics.winRate}%`} tone="green" />
          <MetricTile label="Sharpe" value={metrics.sharpeRatio} tone="blue" />
          <MetricTile label="Max drawdown" value={`${metrics.maxDrawdown}%`} tone="red" />
          <MetricTile label="Profit factor" value={metrics.profitFactor} tone="amber" />
          <MetricTile label="Expectancy" value={`$${metrics.expectancy}`} />
        </div>
      ) : null}
    </div>
  );
}
