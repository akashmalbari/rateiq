"use client";

import { useMemo } from "react";
import { TradeCard } from "@/components/trade-card";
import { Badge } from "@/components/ui/badge";
import type { Recommendation, StrategyType } from "@/lib/trading/types";

const INCOME_ORDER: StrategyType[] = ["cash_secured_put", "covered_call"];

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
  const visible = useMemo(
    () => recommendations.filter((recommendation) => INCOME_ORDER.includes(recommendation.strategyType)),
    [recommendations]
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

      <div className="grid gap-2 sm:grid-cols-2">
        {INCOME_ORDER.map((strategyType) => {
          const count = visible.filter(
            (recommendation) => recommendation.strategyType === strategyType
          ).length;
          return (
            <div key={strategyType} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <p className="data-label">{strategyLabel(strategyType)}</p>
              <p className="mt-1 font-mono text-xl font-bold text-slate-100">{count}</p>
            </div>
          );
        })}
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
          No cash-secured put or covered-call setups cleared the delta, probability,
          liquidity, spread-quality, and earnings filters in this scan.
        </div>
      )}
    </section>
  );
}
