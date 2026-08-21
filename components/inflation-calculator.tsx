"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarRange,
  Landmark,
  PiggyBank,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FIRST_CPI_YEAR,
  LAST_COMPLETE_CPI_YEAR,
  LATEST_CPI_YEAR,
  LONG_RUN_INFLATION_RATE,
  MAX_PROJECTION_YEAR,
  RECENT_INFLATION_RATE,
  equivalentValue,
  inflationTimeline
} from "@/lib/inflation/cpi-data";
import { cn } from "@/lib/utils";
import type { LatestCpiSnapshot } from "@/lib/inflation/bls";
import { preservedPortfolioIncome } from "@/lib/inflation/portfolio-projection";

type CalculatorMode = "value" | "lifestyle" | "portfolio";
type RateModel = "long-run" | "recent" | "custom";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1
});

const yearOptions = Array.from(
  { length: MAX_PROJECTION_YEAR - FIRST_CPI_YEAR + 1 },
  (_, index) => FIRST_CPI_YEAR + index
);

const rateModels: Array<{ id: RateModel; label: string; rate: number }> = [
  { id: "long-run", label: "Long-run history", rate: LONG_RUN_INFLATION_RATE },
  { id: "recent", label: "Recent 20 years", rate: RECENT_INFLATION_RATE },
  { id: "custom", label: "Custom", rate: 3 }
];

const chartTooltipStyle = {
  background: "#101722",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 6,
  color: "#e2e8f0"
};

function numericInput(value: string, fallback: number) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function YearSelect({
  id,
  value,
  onChange,
  min = FIRST_CPI_YEAR
}: {
  id: string;
  value: number;
  onChange: (year: number) => void;
  min?: number;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-10 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-400/60"
    >
      {yearOptions.filter((year) => year >= min).map((year) => (
        <option key={year} value={year}>
          {year}{year > LATEST_CPI_YEAR ? " (projected)" : ""}
        </option>
      ))}
    </select>
  );
}

function RateControls({
  model,
  setModel,
  customRate,
  setCustomRate
}: {
  model: RateModel;
  setModel: (model: RateModel) => void;
  customRate: number;
  setCustomRate: (rate: number) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Future inflation assumption</Label>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Future inflation assumption">
        {rateModels.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={model === option.id}
            onClick={() => setModel(option.id)}
            className={cn(
              "min-h-14 rounded-md border px-2 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
              model === option.id
                ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
                : "border-white/10 bg-white/[0.025] text-slate-400 hover:bg-white/[0.05]"
            )}
          >
            <span className="block font-semibold">{option.label}</span>
            <span className="mt-1 block font-mono">
              {option.id === "custom" ? customRate : option.rate.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
      {model === "custom" ? (
        <div className="space-y-2">
          <Label htmlFor="custom-inflation">Annual inflation rate</Label>
          <div className="relative">
            <Input
              id="custom-inflation"
              type="number"
              min="-5"
              max="20"
              step="0.1"
              value={customRate}
              onChange={(event) => setCustomRate(Number(event.target.value))}
              className="pr-9 font-mono"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProjectionChart({
  data,
  label
}: {
  data: Array<{ year: number; actual: number | null; projected: number | null }>;
  label: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-72 w-full animate-pulse rounded-md bg-white/[0.035]" />;
  }

  return (
    <div className="h-72 w-full" aria-label={label}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 4, right: 12, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
          <XAxis dataKey="year" stroke="#64748b" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => compactCurrency.format(value)}
            width={64}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => currency.format(Number(value ?? 0))}
            labelFormatter={(year) => `Year ${year}`}
          />
          <Line type="monotone" dataKey="actual" name="BLS CPI" stroke="#34d399" strokeWidth={2.5} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="projected" name="Projection" stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="7 5" dot={false} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InflationCalculator({ latestCpi }: { latestCpi: LatestCpiSnapshot }) {
  const [mode, setMode] = useState<CalculatorMode>("value");
  const [amount, setAmount] = useState(1000);
  const [fromYear, setFromYear] = useState(2000);
  const [toYear, setToYear] = useState(2036);
  const [monthlyIncome, setMonthlyIncome] = useState(6000);
  const [lifestyleYear, setLifestyleYear] = useState(2036);
  const [portfolioValue, setPortfolioValue] = useState(1_000_000);
  const [portfolioYear, setPortfolioYear] = useState(2036);
  const [portfolioReturnRate, setPortfolioReturnRate] = useState(7);
  const [rateModel, setRateModel] = useState<RateModel>("long-run");
  const [customRate, setCustomRate] = useState(3);

  const futureRate =
    rateModel === "custom"
      ? customRate
      : rateModels.find((option) => option.id === rateModel)?.rate ?? LONG_RUN_INFLATION_RATE;
  const boundedFutureRate = Math.min(20, Math.max(-5, futureRate));
  const boundedPortfolioReturn = Math.min(30, Math.max(-10, portfolioReturnRate));

  const valueResult = useMemo(
    () => equivalentValue({ amount, fromYear, toYear, futureInflationRate: boundedFutureRate, latestCpi: latestCpi.value }),
    [amount, fromYear, toYear, boundedFutureRate, latestCpi.value]
  );
  const valueChart = useMemo(
    () => inflationTimeline({ amount, fromYear, toYear, futureInflationRate: boundedFutureRate, latestCpi: latestCpi.value }),
    [amount, fromYear, toYear, boundedFutureRate, latestCpi.value]
  );
  const lifestyleResult = useMemo(
    () =>
      equivalentValue({
        amount: monthlyIncome,
        fromYear: LATEST_CPI_YEAR,
        toYear: lifestyleYear,
        futureInflationRate: boundedFutureRate,
        latestCpi: latestCpi.value
      }),
    [monthlyIncome, lifestyleYear, boundedFutureRate, latestCpi.value]
  );
  const lifestyleChart = useMemo(
    () =>
      inflationTimeline({
        amount: monthlyIncome,
        fromYear: LATEST_CPI_YEAR,
        toYear: lifestyleYear,
        futureInflationRate: boundedFutureRate,
        latestCpi: latestCpi.value
      }),
    [monthlyIncome, lifestyleYear, boundedFutureRate, latestCpi.value]
  );

  const portfolioResult = useMemo(
    () =>
      preservedPortfolioIncome({
        portfolioValue,
        annualReturnRate: boundedPortfolioReturn,
        inflationRate: boundedFutureRate
      }),
    [portfolioValue, boundedPortfolioReturn, boundedFutureRate]
  );
  const portfolioValueToday = useMemo(
    () =>
      equivalentValue({
        amount: portfolioValue,
        fromYear: portfolioYear,
        toYear: LATEST_CPI_YEAR,
        futureInflationRate: boundedFutureRate,
        latestCpi: latestCpi.value
      })?.value ?? 0,
    [portfolioValue, portfolioYear, boundedFutureRate, latestCpi.value]
  );
  const portfolioChart = useMemo(
    () =>
      inflationTimeline({
        amount: portfolioValueToday,
        fromYear: LATEST_CPI_YEAR,
        toYear: portfolioYear,
        futureInflationRate: boundedFutureRate,
        latestCpi: latestCpi.value
      }),
    [portfolioValueToday, portfolioYear, boundedFutureRate, latestCpi.value]
  );

  const chartData = mode === "value" ? valueChart : mode === "lifestyle" ? lifestyleChart : portfolioChart;
  const requiredMonthly = lifestyleResult?.value ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid w-full grid-cols-3 rounded-md border border-white/10 bg-[#11161F] p-1 sm:inline-grid sm:w-auto" role="tablist" aria-label="Inflation calculator mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "value"}
          onClick={() => setMode("value")}
          className={cn("min-h-10 rounded px-2 py-2 text-xs font-semibold leading-4 transition-colors sm:px-4 sm:text-sm", mode === "value" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white")}
        >
          Dollar value
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "lifestyle"}
          onClick={() => setMode("lifestyle")}
          className={cn("min-h-10 rounded px-2 py-2 text-xs font-semibold leading-4 transition-colors sm:px-4 sm:text-sm", mode === "lifestyle" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white")}
        >
          Lifestyle income
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "portfolio"}
          onClick={() => setMode("portfolio")}
          className={cn("min-h-10 rounded px-2 py-2 text-xs font-semibold leading-4 transition-colors sm:px-4 sm:text-sm", mode === "portfolio" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white")}
        >
          Portfolio projection
        </button>
      </div>

      <section className="grid overflow-hidden rounded-lg border border-white/10 bg-[#141922]/85 shadow-premium lg:grid-cols-[0.42fr_0.58fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="space-y-5">
            {mode === "value" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="historical-amount">Dollar amount</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span>
                    <Input
                      id="historical-amount"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(numericInput(event.target.value, 0))}
                      className="pl-7 font-mono"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="from-year">From year</Label>
                    <YearSelect id="from-year" value={fromYear} onChange={setFromYear} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to-year">To year</Label>
                    <YearSelect id="to-year" value={toYear} onChange={setToYear} />
                  </div>
                </div>
              </>
            ) : mode === "lifestyle" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="monthly-income">Comfortable monthly income today</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span>
                    <Input
                      id="monthly-income"
                      inputMode="decimal"
                      value={monthlyIncome}
                      onChange={(event) => setMonthlyIncome(numericInput(event.target.value, 0))}
                      className="pl-7 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifestyle-year">Target year</Label>
                  <YearSelect id="lifestyle-year" value={lifestyleYear} onChange={setLifestyleYear} min={LATEST_CPI_YEAR} />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[1, 2, 5, 10, 20, 30].map((years) => (
                    <Button
                      key={years}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setLifestyleYear(LATEST_CPI_YEAR + years)}
                    >
                      +{years}y
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="portfolio-value">Portfolio value in target year</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span>
                    <Input
                      id="portfolio-value"
                      inputMode="decimal"
                      value={portfolioValue}
                      onChange={(event) => setPortfolioValue(numericInput(event.target.value, 0))}
                      className="pl-7 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio-year">Target year</Label>
                  <YearSelect id="portfolio-year" value={portfolioYear} onChange={setPortfolioYear} min={LATEST_CPI_YEAR} />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[1, 2, 5, 10, 20, 30].map((years) => (
                    <Button
                      key={years}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setPortfolioYear(LATEST_CPI_YEAR + years)}
                    >
                      +{years}y
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio-return">Expected annual portfolio return</Label>
                  <div className="relative">
                    <Input
                      id="portfolio-return"
                      type="number"
                      min="-10"
                      max="30"
                      step="0.1"
                      value={portfolioReturnRate}
                      onChange={(event) => setPortfolioReturnRate(Number(event.target.value))}
                      className="pr-9 font-mono"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">%</span>
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-white/10 pt-5">
              <RateControls
                model={rateModel}
                setModel={setRateModel}
                customRate={customRate}
                setCustomRate={setCustomRate}
              />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {mode === "value" ? (
            <div className="space-y-6">
              <div>
                <p className="data-label">Equivalent buying power</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-slate-300">{currency.format(amount)}</span>
                  <ArrowRight className="size-5 text-slate-600" aria-hidden="true" />
                  <span className="font-mono text-4xl font-bold text-emerald-300">{currency.format(valueResult?.value ?? 0)}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  {fromYear} dollars expressed in {toYear} purchasing power.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <TrendingUp className="size-4 text-emerald-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Price change</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{(valueResult?.cumulativeChangePct ?? 0).toFixed(1)}%</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <Landmark className="size-4 text-sky-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Value multiple</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{(valueResult?.multiplier ?? 0).toFixed(2)}x</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <CalendarRange className="size-4 text-amber-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Time span</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{Math.abs(toYear - fromYear)} years</p>
                </div>
              </div>
            </div>
          ) : mode === "lifestyle" ? (
            <div className="space-y-6">
              <div>
                <p className="data-label">Income needed in {lifestyleYear}</p>
                <p className="mt-3 font-mono text-4xl font-bold text-emerald-300">{currency.format(requiredMonthly)}<span className="ml-2 text-base font-medium text-slate-500">/ month</span></p>
                <p className="mt-3 text-sm text-slate-400">
                  To maintain the buying power of {currency.format(monthlyIncome)} per month in {LATEST_CPI_YEAR}.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                  <BadgeDollarSign className="size-4 text-emerald-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Annual income</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{currency.format(requiredMonthly * 12)}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <TrendingUp className="size-4 text-amber-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Monthly increase</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{currency.format(requiredMonthly - monthlyIncome)}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <CalendarRange className="size-4 text-sky-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Cumulative inflation</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{(lifestyleResult?.cumulativeChangePct ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="data-label">Sustainable annual income in {portfolioYear}</p>
                <p className="mt-3 font-mono text-4xl font-bold text-emerald-300">
                  {currency.format(portfolioResult?.annualIncome ?? 0)}
                  <span className="ml-2 text-base font-medium text-slate-500">/ year</span>
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  From a {currency.format(portfolioValue)} portfolio earning {boundedPortfolioReturn.toFixed(1)}%,
                  after retaining enough return to offset {boundedFutureRate.toFixed(2)}% inflation.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                  <BadgeDollarSign className="size-4 text-emerald-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Monthly income</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">
                    {currency.format(portfolioResult?.monthlyIncome ?? 0)}
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <TrendingUp className="size-4 text-sky-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Gross annual return</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">
                    {currency.format(portfolioResult?.grossAnnualReturn ?? 0)}
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <PiggyBank className="size-4 text-amber-300" aria-hidden="true" />
                  <p className="mt-3 data-label">Inflation reserve</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">
                    {currency.format(portfolioResult?.inflationReserve ?? 0)}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex gap-3 rounded-md border p-4 text-sm leading-6",
                  portfolioResult?.preservesPurchasingPower
                    ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-100"
                    : "border-amber-400/25 bg-amber-400/[0.07] text-amber-100"
                )}
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  {portfolioResult?.preservesPurchasingPower
                    ? `After taking this income, the projected balance is ${currency.format(portfolioResult.closingBalanceAfterIncome)}. That preserves ${currency.format(portfolioValue)} of ${portfolioYear} purchasing power after one year.`
                    : `The assumed return does not keep pace with inflation. No income is available while preserving purchasing power; the projected balance reaches ${currency.format(portfolioResult?.closingBalanceAfterIncome ?? 0)} versus ${currency.format(portfolioResult?.requiredClosingBalance ?? 0)} required.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#141922]/80 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="data-label">{mode === "portfolio" ? "Portfolio value path" : "Buying power path"}</p>
            <h2 className="mt-2 font-heading text-xl font-semibold text-white">
              {mode === "portfolio"
                ? `${currency.format(portfolioValueToday)} today to ${currency.format(portfolioValue)} in ${portfolioYear}`
                : "Actual CPI and future projection"}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" />BLS CPI</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-400" />Projected</span>
          </div>
        </div>
        <div className="mt-5">
          <ProjectionChart
            data={chartData}
            label={mode === "portfolio" ? "Target portfolio value over time" : "Inflation-adjusted buying power over time"}
          />
        </div>
      </section>

      <div className="grid gap-4 border-y border-white/10 py-5 text-sm text-slate-400 md:grid-cols-3">
        <div>
          <p className="data-label">Historical data</p>
          <p className="mt-2 leading-6">BLS CPI-U annual averages through {LAST_COMPLETE_CPI_YEAR}.</p>
        </div>
        <div>
          <p className="data-label">Current year</p>
          <p className="mt-2 leading-6">{latestCpi.year} uses the latest {latestCpi.month} CPI index of {latestCpi.value.toFixed(3)}.</p>
        </div>
        <div>
          <p className="data-label">Future years</p>
          <p className="mt-2 leading-6">Compounded at the selected annual assumption; projections are estimates.</p>
        </div>
      </div>
    </div>
  );
}
