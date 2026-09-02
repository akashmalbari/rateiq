import { NextResponse } from "next/server";
import { schedulerSecret } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  isEasternSettlementWindow,
  settleExpiredRecommendations
} from "@/lib/trading/expiration-outcomes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  if (!schedulerSecret) return process.env.NODE_ENV !== "production";
  return (
    request.headers.get("x-figure-my-money-cron") === schedulerSecret ||
    request.headers.get("authorization") === `Bearer ${schedulerSecret}`
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = new URL(request.url).searchParams.get("force") === "true";
  if (process.env.NODE_ENV === "production" && !force && !isEasternSettlementWindow()) {
    return NextResponse.json({
      skipped: true,
      reason: "Outside the 4:30 PM Eastern expiration settlement window."
    });
  }

  try {
    const result = await settleExpiredRecommendations();
    logger.info("Recommendation expiration settlement completed", result);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Expiration settlement failed.";
    logger.error("Recommendation expiration settlement failed", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
