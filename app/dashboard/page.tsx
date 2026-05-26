import { RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MetricTile } from "@/components/metric-tile";
import { ConfidenceChart } from "@/components/charts/performance-chart";
import { DashboardStrategyTabs } from "@/components/dashboard-strategy-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { getStrategyCategory } from "@/lib/trading/strategy-categories";
import { runDailyOptionsScan } from "@/lib/trading/scanner";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login?next=/dashboard");
    }
  }

  const scan = await runDailyOptionsScan({ maxRecommendations: 10 });
  const basicRecommendations = scan.recommendations.filter(
    (recommendation) => getStrategyCategory(recommendation.strategyType) === "basic"
  );
  const top = basicRecommendations[0] ?? scan.recommendations[0];

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="success">Daily scan</Badge>
            <h1 className="mt-4 font-heading text-4xl font-bold tracking-normal text-white">
              Options Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Latest NASDAQ-100 options ideas with single-leg call/put signals
              prioritized first and spreads separated into an advanced workflow.
            </p>
          </div>
          <Button asChild variant="secondary">
            <a href="/dashboard" data-testid="refresh-dashboard-button">
              <RefreshCw aria-hidden="true" />
              Refresh
            </a>
          </Button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Market Regime" value={scan.marketRegime.label.replaceAll("_", " ")} detail={`Score ${scan.marketRegime.score}`} tone="blue" />
          <MetricTile label="Universe" value={scan.universeCount} detail={`${scan.analyzedCount} candidates passed`} />
          <MetricTile label="Top POP" value={top ? `${top.probabilityOfProfit}%` : "N/A"} tone="green" />
          <MetricTile label="VIX Proxy" value={scan.marketRegime.vixLevel.toFixed(1)} detail={`${scan.marketRegime.breadth}% breadth`} tone="amber" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceChart recommendations={scan.recommendations} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Regime Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scan.marketRegime.notes.map((note) => (
                <div key={note} className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
                  {note}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <DashboardStrategyTabs recommendations={scan.recommendations} />
      </main>
      <SiteFooter />
    </div>
  );
}
