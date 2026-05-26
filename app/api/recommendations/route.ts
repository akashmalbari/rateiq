import { NextResponse } from "next/server";
import { getLatestRecommendations } from "@/lib/trading/persistence";
import { runDailyOptionsScan } from "@/lib/trading/scanner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 10);
  const stored = await getLatestRecommendations(limit);

  if (stored) {
    return NextResponse.json({ recommendations: stored, source: "supabase" });
  }

  const scan = await runDailyOptionsScan({ maxRecommendations: limit });
  return NextResponse.json({ recommendations: scan.recommendations, marketRegime: scan.marketRegime, source: "demo-scan" });
}
