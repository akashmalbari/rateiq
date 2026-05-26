import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runLightweightBacktest } from "@/lib/trading/backtester";

const schema = z.object({
  strategyType: z.enum([
    "cash_secured_put",
    "covered_call",
    "bull_put_credit_spread",
    "bear_call_credit_spread",
    "bull_call_debit_spread",
    "bear_put_debit_spread",
    "iron_condor",
    "directional_call",
    "directional_put"
  ]),
  symbol: z.string().min(1).max(8).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await request.json());
    const metrics = runLightweightBacktest(input);

    if (isSupabaseConfigured) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("backtests").insert({
        strategy_slug: input.strategyType,
        symbol: input.symbol ?? null,
        start_date: input.startDate ?? new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10),
        end_date: input.endDate ?? new Date().toISOString().slice(0, 10),
        metrics,
        parameters: input,
        created_by: user.id
      });
    }

    return NextResponse.json({ metrics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backtest failed.";
    return NextResponse.json({ error: message }, { status: message.includes("Authentication") ? 401 : 400 });
  }
}
