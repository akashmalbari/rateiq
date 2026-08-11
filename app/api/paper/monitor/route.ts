import { NextResponse } from "next/server";
import { schedulerSecret } from "@/lib/env";
import { logger } from "@/lib/logger";
import { runPaperMonitoringCycle } from "@/lib/paper-trading/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  if (!schedulerSecret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${schedulerSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPaperMonitoringCycle();
    logger.info("Paper portfolio monitor completed", { ...result });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paper monitor failed.";
    logger.error("Paper portfolio monitor failed", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
