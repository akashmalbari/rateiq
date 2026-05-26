import { ArrowRight, CalendarDays, Gauge, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricTile } from "@/components/metric-tile";
import type { Recommendation } from "@/lib/trading/types";

export function TradeCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <Card data-testid={`trade-card-${recommendation.symbol.toLowerCase()}`}>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">#{recommendation.rank}</Badge>
              <Badge variant="blue">{recommendation.strategyName}</Badge>
              <Badge variant={recommendation.confidenceScore >= 76 ? "success" : "default"}>
                {recommendation.confidenceScore} confidence
              </Badge>
            </div>
            <CardTitle className="mt-3 text-2xl">
              {recommendation.symbol}
              <span className="ml-3 align-middle text-sm font-medium text-slate-500">
                {recommendation.companyName}
              </span>
            </CardTitle>
          </div>
          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm text-slate-300">
            {recommendation.expirationDate}
          </div>
        </div>
        <Progress value={recommendation.confidenceScore} />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Probability" value={`${recommendation.probabilityOfProfit}%`} tone="green" />
          <MetricTile label="Max Risk" value={`$${recommendation.maxRisk.toFixed(0)}`} tone="red" />
          <MetricTile label="Max Reward" value={`$${recommendation.maxReward.toFixed(0)}`} tone="amber" />
          <MetricTile label="R/R" value={recommendation.riskRewardRatio.toFixed(2)} tone="blue" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-white/10 bg-[#0B0E14]/70 p-4">
            <p className="data-label">Trade Plan</p>
            <div className="mt-3 grid gap-3 text-sm text-slate-300">
              <p className="flex gap-2"><ArrowRight className="mt-0.5 size-4 shrink-0 text-amber-300" />{recommendation.entryRecommendation}</p>
              <p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" />{recommendation.exitRecommendation}</p>
              <p className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-sky-300" />{recommendation.tradePlan.timeStop}</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0B0E14]/70 p-4">
            <p className="data-label">Greeks / Vol</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <span className="text-slate-500">Delta</span><span className="font-mono text-slate-200">{recommendation.greeks.delta}</span>
              <span className="text-slate-500">Theta</span><span className="font-mono text-slate-200">{recommendation.greeks.theta}</span>
              <span className="text-slate-500">IV %ile</span><span className="font-mono text-slate-200">{recommendation.ivPercentile}</span>
              <span className="text-slate-500">Size</span><span className="font-mono text-slate-200">{recommendation.suggestedPositionSizePct}%</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-400 md:grid-cols-3">
          {recommendation.rationale.slice(0, 3).map((item) => (
            <div key={item} className="flex gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3">
              <TrendingUp className="mt-0.5 size-4 shrink-0 text-emerald-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {recommendation.warnings.length ? (
          <div className="flex gap-2 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
            <Gauge className="mt-0.5 size-4 shrink-0" />
            <span>{recommendation.warnings[0]}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
