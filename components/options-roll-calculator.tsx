"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, ArrowRightLeft, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RollAnalysis } from "@/lib/trading/roll-calculator";
import type { Quote } from "@/lib/trading/types";

type PositionType = "call" | "put";

type RollResponse = {
  quote: Quote;
  analysis: RollAnalysis;
  source: string;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

function dateWeeksFromNow(weeks: number) {
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

function numericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function OptionsRollCalculator() {
  const [symbol, setSymbol] = useState("NVDA");
  const [type, setType] = useState<PositionType>("call");
  const [strike, setStrike] = useState("180");
  const [expiration, setExpiration] = useState(dateWeeksFromNow(3));
  const [closeDebit, setCloseDebit] = useState("8");
  const [entryCredit, setEntryCredit] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [allowDebitRoll, setAllowDebitRoll] = useState(false);
  const [result, setResult] = useState<RollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          type,
          currentStrike: numericValue(strike),
          currentExpiration: expiration,
          closeDebit: numericValue(closeDebit),
          entryCredit: numericValue(entryCredit),
          contracts: Math.max(1, Math.round(numericValue(quantity))),
          allowDebitRoll
        })
      });
      const data = (await response.json()) as RollResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to calculate roll options.");
      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to calculate roll options.");
    } finally {
      setLoading(false);
    }
  }

  const recommendation = result?.analysis.recommendation;

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#141922]/85 shadow-premium">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-sky-300/25 bg-sky-300/10">
            <ArrowRightLeft className="size-5 text-sky-200" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Options Roll Calculator</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              Enter a short call or put you want to close. The calculator ranks liquid, later-expiring replacement contracts using live chain data, executable pricing, Greeks, expected move, and liquidity.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.42fr_0.58fr]">
        <form className="space-y-4 border-b border-white/10 p-5 lg:border-b-0 lg:border-r sm:p-6" onSubmit={calculate}>
          <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-[#0B0E14] p-1" role="group" aria-label="Current option type">
            {(["call", "put"] as const).map((optionType) => (
              <button
                key={optionType}
                type="button"
                aria-pressed={type === optionType}
                onClick={() => setType(optionType)}
                className={`h-9 rounded text-sm font-semibold capitalize transition-colors ${type === optionType ? "bg-sky-300 text-slate-950" : "text-slate-400 hover:text-white"}`}
              >
                Short {optionType}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ticker" htmlFor="roll-symbol">
              <Input id="roll-symbol" value={symbol} maxLength={10} onChange={(event) => setSymbol(event.target.value.toUpperCase())} required />
            </Field>
            <Field label="Contracts" htmlFor="roll-quantity">
              <Input id="roll-quantity" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </Field>
            <Field label="Current strike" htmlFor="roll-strike">
              <CurrencyInput id="roll-strike" value={strike} onChange={setStrike} />
            </Field>
            <Field label="Current expiration" htmlFor="roll-expiration">
              <Input id="roll-expiration" type="date" value={expiration} onChange={(event) => setExpiration(event.target.value)} required />
            </Field>
            <Field label="Buy-to-close price" htmlFor="roll-close-debit">
              <CurrencyInput id="roll-close-debit" value={closeDebit} onChange={setCloseDebit} />
            </Field>
            <Field label="Original credit (optional)" htmlFor="roll-entry-credit">
              <CurrencyInput id="roll-entry-credit" value={entryCredit} onChange={setEntryCredit} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300">
            <input type="checkbox" checked={allowDebitRoll} onChange={(event) => setAllowDebitRoll(event.target.checked)} className="mt-0.5 size-4 accent-amber-400" />
            <span><span className="font-medium text-slate-100">Include debit rolls</span><br /><span className="text-xs text-slate-500">Show safer alternatives even if no replacement can be sold for enough credit.</span></span>
          </label>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            {loading ? "Finding roll candidates…" : "Find best roll"}
          </Button>
          <p className="text-xs leading-5 text-slate-500">Prices are per share; displayed cash results include the 100-share option multiplier. Market data may be delayed or simulated depending on the configured provider.</p>
        </form>

        <div className="p-5 sm:p-6">
          {error ? <div className="rounded-md border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div> : null}
          {!result && !error ? <EmptyState /> : null}
          {result ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Underlying</p><p className="mt-1 text-lg font-semibold text-white">{result.quote.symbol} <span className="font-mono text-slate-300">{money.format(result.quote.price)}</span></p></div>
                <p className="text-xs text-slate-500">Data source: {result.source}</p>
              </div>
              {recommendation ? <Recommendation result={result} /> : <NoRecommendation warnings={result.analysis.warnings} />}
              {recommendation && result.analysis.candidates.length > 1 ? <Alternatives result={result} /> : null}
              {result.analysis.warnings.length ? (
                <div className="space-y-2">
                  {result.analysis.warnings.map((warning) => <p key={warning} className="flex gap-2 text-xs leading-5 text-amber-100"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />{warning}</p>)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6"><AlertTriangle className="mr-1 inline size-3.5 text-amber-300" aria-hidden="true" />Educational decision support only. A roll closes the existing position and realizes its loss or gain; no recommendation guarantees profit or avoids assignment.</div>
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function CurrencyInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span><Input id={id} type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className="pl-7 font-mono" required /></div>;
}

function EmptyState() {
  return <div className="flex min-h-80 flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-white/[0.015] px-6 text-center"><span className="flex size-11 items-center justify-center rounded-full border border-sky-300/25 bg-sky-300/10"><ArrowRightLeft className="size-5 text-sky-200" aria-hidden="true" /></span><h3 className="mt-4 font-semibold text-slate-100">Enter your current position</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">You’ll see the recommended replacement, roll credit or debit, adjusted breakeven, and alternatives.</p></div>;
}

function Recommendation({ result }: { result: RollResponse }) {
  const candidate = result.analysis.recommendation!;
  const cashFlowLabel = candidate.rollCashFlow >= 0 ? "Roll credit" : "Roll debit";
  return <div className="space-y-4"><div className="rounded-md border border-sky-300/25 bg-sky-300/[0.07] p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Recommended replacement</p><p className="mt-2 text-xl font-bold text-white">Sell {result.analysis.type} {candidate.contract.strike.toFixed(2)} · {candidate.contract.expirationDate}</p><p className="mt-1 text-sm text-slate-400">{candidate.daysToExpiration} DTE · {Math.abs(candidate.contract.delta).toFixed(2)} delta · {candidate.liquidityScore}/100 liquidity</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label={cashFlowLabel} value={money.format(Math.abs(candidate.rollCashFlowDollars))} tone={candidate.rollCashFlow >= 0 ? "good" : "bad"} /><Metric label="Adjusted breakeven" value={money.format(candidate.adjustedBreakeven)} /><Metric label="Close P/L" value={money.format(candidate.realizedClosePnl)} tone={candidate.realizedClosePnl >= 0 ? "good" : "bad"} /><Metric label="Expected-move boundary" value={money.format(candidate.expectedMoveBoundary)} /></div><div className="space-y-1.5">{candidate.rationale.map((line) => <p key={line} className="text-sm leading-5 text-slate-400">{line}</p>)}</div></div>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return <div className="rounded-md border border-white/10 bg-[#0B0E14] p-3"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 font-mono text-sm font-semibold ${tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : "text-slate-100"}`}>{value}</p></div>;
}

function NoRecommendation({ warnings }: { warnings: string[] }) {
  return <div className="rounded-md border border-amber-300/25 bg-amber-300/[0.07] p-4"><h3 className="font-semibold text-amber-100">No suitable credit roll found</h3><p className="mt-2 text-sm leading-6 text-slate-400">Try enabling debit rolls, or close the position if your risk limits require it.</p>{warnings.map((warning) => <p key={warning} className="mt-2 text-xs text-amber-100">{warning}</p>)}</div>;
}

function Alternatives({ result }: { result: RollResponse }) {
  return <div><h3 className="mb-2 text-sm font-semibold text-slate-200">Other candidates</h3><div className="space-y-2">{result.analysis.candidates.slice(1, 4).map((candidate) => <div key={candidate.contract.symbol} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 px-3 py-2 text-sm"><span className="font-medium text-slate-200">{candidate.contract.strike.toFixed(2)} {result.analysis.type} · {candidate.contract.expirationDate}</span><span className="font-mono text-slate-400">{candidate.rollCashFlow >= 0 ? "+" : "-"}{money.format(Math.abs(candidate.rollCashFlowDollars))} · {candidate.score}/100</span></div>)}</div></div>;
}
