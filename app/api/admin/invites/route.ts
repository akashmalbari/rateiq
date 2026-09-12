import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import { inviteStatus } from "@/lib/invites/shared";
import { createInviteToken, hashInviteToken } from "@/lib/invites/tokens";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

const inviteSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(365).default(30),
  note: z.string().trim().max(200).optional()
});

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("premium_invites")
      .select("id,token_prefix,note,expires_at,redeemed_at,redeemed_by,revoked_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    return NextResponse.json({
      invites: (data ?? []).map((invite) => ({ ...invite, status: inviteStatus(invite) }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invitations unavailable." },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  const limit = rateLimit(`admin-invites:${getClientIp(request)}`, 20, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const user = await requireAdmin();
    const input = inviteSchema.parse(await request.json());
    const token = createInviteToken();
    const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("premium_invites")
      .insert({
        token_hash: hashInviteToken(token),
        token_prefix: token.slice(0, 8),
        note: input.note || null,
        expires_at: expiresAt,
        created_by: user.id
      })
      .select("id,token_prefix,note,expires_at,created_at")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        invite: { ...data, status: "available" },
        url: `${publicEnv.NEXT_PUBLIC_APP_URL}/invite/${token}`
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation could not be created.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Admin") ? 403 : 400 }
    );
  }
}
