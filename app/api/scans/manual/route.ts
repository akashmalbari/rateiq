import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { persistScanResult } from "@/lib/trading/persistence";
import { runDailyOptionsScan } from "@/lib/trading/scanner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const limit = rateLimit(`manual-scan:${getClientIp(request)}`, 3, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const user = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const scan = await runDailyOptionsScan({
      maxRecommendations: Number(body.maxRecommendations ?? 10),
      allowEarningsVolatility: Boolean(body.allowEarningsVolatility)
    });
    const persisted = await persistScanResult(scan, user.id);
    return NextResponse.json({ scan: persisted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual scan failed.";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 500 });
  }
}
