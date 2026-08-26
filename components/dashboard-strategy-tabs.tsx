"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { TradeCard } from "@/components/trade-card";
import { Badge } from "@/components/ui/badge";
import { sortRecommendationsByAnnualizedYield } from "@/lib/trading/annualized-yield";
import { cn } from "@/lib/utils";
import type { Recommendation, StrategyType, UniverseGroup } from "@/lib/trading/types";

const INCOME_ORDER = ["cash_secured_put", "covered_call"] as const satisfies readonly StrategyType[];
type IncomeStrategy = (typeof INCOME_ORDER)[number];
type DashboardUniverseGroup = Exclude<UniverseGroup, "custom">;

const UNIVERSE_GROUPS: Array<{
  id: DashboardUniverseGroup;
  label: string;
  description: string;
}> = [
  { id: "nasdaq_100", label: "NASDAQ-100", description: "Index constituents" },
  { id: "under_100", label: "Under $100", description: "$10.00 to $99.99" },
  { id: "under_10", label: "Under $10", description: "Below $10.00" }
];

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
  const [selectedGroup, setSelectedGroup] = useState<DashboardUniverseGroup>("nasdaq_100");
  const incomeRecommendations = useMemo(
    () =>
      recommendations.filter((recommendation) =>
        INCOME_ORDER.includes(recommendation.strategyType as IncomeStrategy)
      ),
    [recommendations]
  );
  const visible = useMemo(
    () =>
      sortRecommendationsByAnnualizedYield(
        incomeRecommendations.filter(
          (recommendation) =>
            recommendation.strategyType === selectedStrategy &&
            recommendation.universeGroup === selectedGroup
        )
      ),
    [incomeRecommendations, selectedStrategy, selectedGroup]
  );
  const selectedGroupLabel = UNIVERSE_GROUPS.find((group) => group.id === selectedGroup)?.label;

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-lg border border-white/10 bg-[#151A22]/70 p-4">
        <div>
          <Badge variant="success">Primary income strategies</Badge>
          <h2 className="mt-3 font-heading text-2xl font-bold text-white">
            Cash-Secured Puts &amp; Covered Calls
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Liquid contracts across NASDAQ-100 and price-screened stocks, with the same strict
            0.20-0.40 absolute delta, volume, open-interest, spread, earnings, and theta rules.
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

      <div>
        <p className="mb-2 data-label">Stock universe</p>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Stock universe">
          {UNIVERSE_GROUPS.map((group) => {
            const count = incomeRecommendations.filter(
              (recommendation) =>
                recommendation.strategyType === selectedStrategy &&
                recommendation.universeGroup === group.id
            ).length;
            const isSelected = group.id === selectedGroup;

            return (
              <button
                key={group.id}
                type="button"
                aria-pressed={isSelected}
                aria-controls="income-strategy-results"
                onClick={() => setSelectedGroup(group.id)}
                className={cn(
                  "min-h-16 rounded-md border px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 sm:px-4 sm:text-left",
                  isSelected
                    ? "border-sky-400/50 bg-sky-400/10"
                    : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                )}
              >
                <span className={cn("block text-xs font-semibold sm:text-sm", isSelected ? "text-sky-200" : "text-slate-300")}>{group.label}</span>
                <span className="mt-1 hidden text-xs text-slate-500 sm:block">{group.description}</span>
                <span className="mt-1 block font-mono text-sm font-bold text-white">{count}</span>
              </button>
            );
          })}
        </div>
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
            {selectedGroupLabel} {strategyLabel(selectedStrategy)} opportunities
          </h3>
          <Badge variant="muted">{visible.length} ranked by APY</Badge>
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
            No {selectedGroupLabel} {strategyLabel(selectedStrategy).toLowerCase()} setups cleared the delta,
            probability, liquidity, spread-quality, and earnings filters in this scan.
          </div>
        )}
      </div>
    </section>
  );
}
