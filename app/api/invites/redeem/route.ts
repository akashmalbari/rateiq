import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { parseInviteTokenInput } from "@/lib/invites/shared";
import { hashInviteToken } from "@/lib/invites/tokens";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const redeemSchema = z.object({ token: z.string().min(1).max(512) });

export async function POST(request: Request) {
  const limit = rateLimit(`invite-redeem:${getClientIp(request)}`, 10, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    await requireUser();
    const input = redeemSchema.parse(await request.json());
    const token = parseInviteTokenInput(input.token);
    if (!token) return NextResponse.json({ error: "This invitation link is invalid." }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("redeem_premium_invite", {
      p_token_hash: hashInviteToken(token)
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, inviteId: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation could not be redeemed.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Authentication") ? 401 : 400 }
    );
  }
}
