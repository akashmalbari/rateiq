import { NextResponse } from "next/server";
import { buildPaperTradesCsv } from "@/lib/paper-trading/reporting";
import { PremiumAccessRequiredError, requirePremium } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePremium();
    const csv = await buildPaperTradesCsv();
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="figure-my-money-paper-trades-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export paper trades.";
    const status = error instanceof PremiumAccessRequiredError
      ? 403
      : message.includes("Authentication")
        ? 401
        : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
