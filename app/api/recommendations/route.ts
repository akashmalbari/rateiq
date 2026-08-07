import { NextResponse } from "next/server";
import { getLatestRecommendations } from "@/lib/trading/persistence";
import { runDailyOptionsScan, runTickerOptionsScan } from "@/lib/trading/scanner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10), 1), 25);
  const symbol = url.searchParams.get("symbol")?.trim().toUpperCase();

  if (symbol) {
    if (!/^[A-Z0-9.-]{1,10}$/.test(symbol)) {
      return NextResponse.json({ error: "Enter a valid ticker symbol." }, { status: 400 });
    }

    const scan = await runTickerOptionsScan(symbol, { maxRecommendations: Math.min(limit, 10) });
    return NextResponse.json({
      recommendations: scan.recommendations,
      marketRegime: scan.marketRegime,
      warnings: scan.warnings,
      source: "ticker-scan"
    });
  }

  const stored = await getLatestRecommendations(limit);

  if (stored) {
    return NextResponse.json({ recommendations: stored, source: "supabase" });
  }

  const scan = await runDailyOptionsScan({ maxRecommendations: limit });
  return NextResponse.json({ recommendations: scan.recommendations, marketRegime: scan.marketRegime, source: "demo-scan" });
}
