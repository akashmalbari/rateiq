import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import { PAPER_ACCOUNT_SLUG } from "@/lib/paper-trading/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const capitalAdjustmentSchema = z.object({
  amount: z.coerce.number().finite().positive().max(1_000_000),
  direction: z.enum(["contribution", "withdrawal"])
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`paper-capital:${getClientIp(request)}`, 10, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const user = await requireAdmin();
    const body = capitalAdjustmentSchema.parse(await request.json());
    const amount = body.direction === "withdrawal" ? -body.amount : body.amount;
    const supabase = createSupabaseAdminClient();
    const { data: account, error: accountError } = await supabase
      .from("paper_accounts")
      .select("id")
      .eq("slug", PAPER_ACCOUNT_SLUG)
      .single();
    if (accountError || !account) throw new Error(accountError?.message ?? "Paper account was not found.");

    const { data: cashBalance, error } = await supabase.rpc("adjust_paper_capital", {
      p_account_id: account.id,
      p_amount: amount,
      p_actor_user_id: user.id,
      p_note: `Admin ${body.direction} from paper portfolio`
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ cashBalance, amount, direction: body.direction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Capital adjustment failed.";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 400 });
  }
}
