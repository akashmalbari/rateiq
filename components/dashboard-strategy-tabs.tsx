"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { TradeCard } from "@/components/trade-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Recommendation, StrategyType } from "@/lib/trading/types";

const INCOME_ORDER = ["cash_secured_put", "covered_call"] as const satisfies readonly StrategyType[];
type IncomeStrategy = (typeof INCOME_ORDER)[number];

function strategyLabel(strategyType: StrategyType) {
  return strategyType
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardStrategyTabs({
  recommendations
}: {
  recommendations: Recommendation[];
}) {
  const [selectedStrategy, setSelectedStrategy] = useState<IncomeStrategy>("cash_secured_put");
  const incomeRecommendations = useMemo(
    () =>
      recommendations.filter((recommendation) =>
        INCOME_ORDER.includes(recommendation.strategyType as IncomeStrategy)
      ),
    [recommendations]
  );
  const visible = useMemo(
    () =>
      incomeRecommendations.filter(
        (recommendation) => recommendation.strategyType === selectedStrategy
      ),
    [incomeRecommendations, selectedStrategy]
  );

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-lg border border-white/10 bg-[#151A22]/70 p-4">
        <div>
          <Badge variant="success">Primary income strategies</Badge>
          <h2 className="mt-3 font-heading text-2xl font-bold text-white">
            Cash-Secured Puts &amp; Covered Calls
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Liquid NASDAQ-100 contracts ranked within a strict 0.20-0.40 absolute delta range.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Income strategy">
        {INCOME_ORDER.map((strategyType) => {
          const count = incomeRecommendations.filter(
            (recommendation) => recommendation.strategyType === strategyType
          ).length;
          const isSelected = strategyType === selectedStrategy;
          return (
            <button
              key={strategyType}
              type="button"
              aria-pressed={isSelected}
              aria-controls="income-strategy-results"
              onClick={() => setSelectedStrategy(strategyType)}
              className={cn(
                "flex min-h-20 items-center justify-between rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
                isSelected
                  ? "border-amber-400/50 bg-amber-400/10"
                  : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
              )}
            >
              <span>
                <span className={cn("data-label", isSelected && "text-amber-200")}>
                  {strategyLabel(strategyType)}
                </span>
                <span className="mt-1 block font-mono text-xl font-bold text-slate-100">
                  {count}
                </span>
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border",
                  isSelected
                    ? "border-amber-400/50 bg-amber-400 text-slate-950"
                    : "border-white/10 text-transparent"
                )}
                aria-hidden="true"
              >
                <Check className="size-4" />
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="income-strategy-results"
        role="region"
        aria-label={`${strategyLabel(selectedStrategy)} opportunities`}
        aria-live="polite"
        className="space-y-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-heading text-xl font-semibold text-white">
            {strategyLabel(selectedStrategy)} opportunities
          </h3>
          <Badge variant="muted">{visible.length} ranked</Badge>
        </div>

        {visible.length ? (
          visible.map((recommendation, index) => (
            <TradeCard
              key={`${recommendation.symbol}-${recommendation.strategyType}`}
              recommendation={{ ...recommendation, rank: index + 1 }}
            />
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-8 text-sm text-slate-400">
            No {strategyLabel(selectedStrategy).toLowerCase()} setups cleared the delta,
            probability, liquidity, spread-quality, and earnings filters in this scan.
          </div>
        )}
      </div>
    </section>
  );
}
