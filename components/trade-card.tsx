import { ArrowRight, CalendarDays, CircleDollarSign, Gauge, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  calculateAnnualizedYield,
  recommendationCollateral
} from "@/lib/trading/annualized-yield";
import type { Recommendation } from "@/lib/trading/types";

export function TradeCard({ recommendation }: { recommendation: Recommendation }) {
  const netOptionAmount = recommendation.optionLegs.reduce(
    (total, leg) => total + (leg.action === "sell" ? leg.mid : -leg.mid),
    0
  ) * 100;
  const isCredit = netOptionAmount >= 0;
  const collateral = recommendationCollateral(recommendation);
  const annualizedYield = calculateAnnualizedYield({
    credit: isCredit ? netOptionAmount : 0,
    collateral,
    openedAt: recommendation.createdAt,
    expirationDate: recommendation.expirationDate
  });

  return (
    <Card data-testid={`trade-card-${recommendation.symbol.toLowerCase()}`}>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
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
          <div className="shrink-0 rounded-md border border-white/10 bg-white/[0.035] px-4 py-3 sm:text-right">
            <p className="data-label">Stock Price</p>
            <p className="mt-1 font-mono text-xl font-bold text-white">
              ${recommendation.underlyingPrice.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-500">At scan time</p>
          </div>
        </div>
        <Progress value={recommendation.confidenceScore} />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-sky-400/25 bg-sky-400/[0.07] p-4">
            <div className="flex items-center gap-2 text-sky-200">
              <CalendarDays className="size-4" aria-hidden="true" />
              <p className="data-label text-sky-200">Expiration</p>
            </div>
            <p className="mt-2 font-mono text-xl font-bold text-white">{recommendation.expirationDate}</p>
          </div>
          <div className="rounded-md border border-amber-400/25 bg-amber-400/[0.07] p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <Target className="size-4" aria-hidden="true" />
              <p className="data-label text-amber-200">Strike Price</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">
              ${recommendation.strikePrice.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
            <div className="flex items-center gap-2 text-emerald-200">
              <CircleDollarSign className="size-4" aria-hidden="true" />
              <p className="data-label text-emerald-200">{isCredit ? "Credit Received" : "Net Debit"}</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">
              ${Math.abs(netOptionAmount).toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border border-violet-400/25 bg-violet-400/[0.07] p-4">
            <div className="flex items-center gap-2 text-violet-200">
              <TrendingUp className="size-4" aria-hidden="true" />
              <p className="data-label text-violet-200">APY</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-violet-200">
              {annualizedYield ? `${annualizedYield.annualizedYieldPct.toFixed(1)}%` : "N/A"}
            </p>
            {annualizedYield ? (
              <p className="mt-1 text-xs text-slate-400">
                {`$${annualizedYield.collateral.toLocaleString("en-US", {
                  maximumFractionDigits: 0
                })}`} collateral · {annualizedYield.holdingDays} days
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-y border-white/10 py-3 text-sm">
          <span className="text-slate-400">Probability <strong className="ml-1 font-mono text-emerald-300">{recommendation.probabilityOfProfit}%</strong></span>
          <span className="text-slate-400">Max risk <strong className="ml-1 font-mono text-rose-300">${recommendation.maxRisk.toFixed(0)}</strong></span>
          <span className="text-slate-400">Max reward <strong className="ml-1 font-mono text-amber-300">${recommendation.maxReward.toFixed(0)}</strong></span>
          <span className="text-slate-400">R/R <strong className="ml-1 font-mono text-sky-300">{recommendation.riskRewardRatio.toFixed(2)}</strong></span>
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
