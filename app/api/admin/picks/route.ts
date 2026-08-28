import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { getAdminPickSymbols, saveAdminPickSymbols } from "@/lib/trading/admin-picks";
import { MAX_ADMIN_PICK_SYMBOLS, parseTickerList } from "@/lib/trading/ticker-list";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin access required." },
      { status: 403 }
    );
  }

  try {
    const symbols = await getAdminPickSymbols();
    return NextResponse.json({ symbols, limit: MAX_ADMIN_PICK_SYMBOLS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin's Picks could not be loaded." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin access required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = parseTickerList(
      typeof body.symbols === "string" || Array.isArray(body.symbols) ? body.symbols : ""
    );
    if (parsed.invalid.length) {
      return NextResponse.json(
        { error: `Invalid ticker symbols: ${parsed.invalid.join(", ")}` },
        { status: 400 }
      );
    }
    if (parsed.exceedsLimit) {
      return NextResponse.json(
        { error: `Admin's Picks accepts up to ${MAX_ADMIN_PICK_SYMBOLS} unique tickers.` },
        { status: 400 }
      );
    }

    const symbols = await saveAdminPickSymbols(parsed.symbols);
    return NextResponse.json({ symbols, limit: MAX_ADMIN_PICK_SYMBOLS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin's Picks could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
