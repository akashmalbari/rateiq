"use client";

import { useMemo, useState } from "react";
import { TradeCard } from "@/components/trade-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStrategyCategory } from "@/lib/trading/strategy-categories";
import type { Recommendation } from "@/lib/trading/types";

export function DashboardStrategyTabs({
  recommendations
}: {
  recommendations: Recommendation[];
}) {
  const [tab, setTab] = useState<"basic" | "advanced">("basic");
  const groups = useMemo(
    () => ({
      basic: recommendations.filter(
        (recommendation) => getStrategyCategory(recommendation.strategyType) === "basic"
      ),
      advanced: recommendations.filter(
        (recommendation) => getStrategyCategory(recommendation.strategyType) === "advanced"
      )
    }),
    [recommendations]
  );
  const visible = groups[tab];

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#151A22]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={tab === "basic" ? "success" : "muted"}>Primary</Badge>
            <Badge variant={tab === "advanced" ? "blue" : "muted"}>Defined risk</Badge>
          </div>
          <h2 className="mt-3 font-heading text-2xl font-bold text-white">
            {tab === "basic" ? "Basic Options Signals" : "Advanced Spread Signals"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {tab === "basic"
              ? "Primary analysis for single-leg buy/sell calls and buy/sell puts."
              : "Defined-risk spreads and multi-leg structures for more experienced options traders."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/20 p-1">
          <Button
            type="button"
            size="sm"
            variant={tab === "basic" ? "default" : "ghost"}
            onClick={() => setTab("basic")}
            data-testid="basic-strategies-tab"
          >
            Basic ({groups.basic.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "advanced" ? "default" : "ghost"}
            onClick={() => setTab("advanced")}
            data-testid="advanced-strategies-tab"
          >
            Advanced ({groups.advanced.length})
          </Button>
        </div>
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
          No {tab} setups cleared the probability, liquidity, spread-quality, and
          earnings filters in this scan.
        </div>
      )}
    </section>
  );
}
