import { NextResponse } from "next/server";
import { schedulerSecret } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendDailyDigest } from "@/lib/email/daily-digest";
import { openPaperPositionsForScan } from "@/lib/paper-trading/engine";
import { persistScanResult } from "@/lib/trading/persistence";
import { runDailyOptionsScan } from "@/lib/trading/scanner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  if (!schedulerSecret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${schedulerSecret}`;
}

function isEasternScanWindow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  const weekday = value("weekday");
  const hour = value("hour");
  const minute = value("minute");
  return weekday !== "Sat" && weekday !== "Sun" && hour === "10" && minute === "30";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  if (process.env.NODE_ENV === "production" && url.searchParams.get("force") !== "true" && !isEasternScanWindow()) {
    return NextResponse.json({ skipped: true, reason: "Outside 10:30 AM Eastern scan window." });
  }

  try {
    const scan = await runDailyOptionsScan({ maxRecommendations: 15 });
    const persisted = await persistScanResult(scan);
    let paper: Awaited<ReturnType<typeof openPaperPositionsForScan>>;
    try {
      paper = persisted.scanId
        ? await openPaperPositionsForScan(persisted.scanId)
        : { skipped: true, reason: "The scan was not persisted." };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Paper entry cycle failed.";
      logger.error("Automated paper entry cycle failed", { reason });
      paper = { skipped: true, reason, errors: [reason] };
    }
    const email = await sendDailyDigest(persisted);
    logger.info("Daily options scan completed", {
      recommendations: persisted.recommendations.length,
      emailsSent: email.sent
    });
    return NextResponse.json({ scan: persisted, paper, email });
  } catch (error) {
    logger.error("Daily scan failed", { error: error instanceof Error ? error.message : error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily scan failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scan = await runDailyOptionsScan({ maxRecommendations: 15 });
    const persisted = await persistScanResult(scan);
    const email = await sendDailyDigest(persisted);
    return NextResponse.json({ scan: persisted, email });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily scan failed" },
      { status: 500 }
    );
  }
}
