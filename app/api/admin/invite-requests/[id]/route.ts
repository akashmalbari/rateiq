import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import { PREMIUM_INVITE_SUBJECT, sendPremiumInviteEmail } from "@/lib/email/invite-email";
import { createPremiumInvite } from "@/lib/invites/service";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const sendSchema = z.object({
  expiresInDays: z.coerce.number().int().min(1).max(365).default(30)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(`admin-invite-request:${getClientIp(request)}`, 20, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let supabase: ReturnType<typeof createSupabaseAdminClient> | null = null;
  let claimedRequestId: string | null = null;
  let inviteId: string | null = null;
  let recipient: string | null = null;
  try {
    const admin = await requireAdmin();
    supabase = createSupabaseAdminClient();
    const { id } = await params;
    const input = sendSchema.parse(await request.json());
    const { data: inviteRequest, error: claimError } = await supabase
      .from("invite_requests")
      .update({ status: "processing", handled_by: admin.id, error_message: null })
      .eq("id", id)
      .eq("status", "pending")
      .select("id,email")
      .maybeSingle();
    if (claimError) throw new Error(claimError.message);
    if (!inviteRequest) {
      return NextResponse.json({ error: "This request was already handled." }, { status: 409 });
    }
    claimedRequestId = inviteRequest.id;
    recipient = inviteRequest.email;

    const created = await createPremiumInvite({
      createdBy: admin.id,
      expiresInDays: input.expiresInDays,
      note: `Requested by ${inviteRequest.email}`
    });
    inviteId = created.invite.id;
    const providerMessageId = await sendPremiumInviteEmail({
      to: inviteRequest.email,
      inviteUrl: created.url,
      expiresAt: created.invite.expires_at
    });
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("invite_requests")
      .update({
        status: "sent",
        invite_id: created.invite.id,
        provider_message_id: providerMessageId,
        invited_at: now,
        handled_at: now
      })
      .eq("id", inviteRequest.id);
    if (updateError) throw new Error(updateError.message);

    await supabase.from("email_logs").insert({
      recipient: inviteRequest.email,
      subject: PREMIUM_INVITE_SUBJECT,
      provider_message_id: providerMessageId,
      status: "sent",
      sent_at: now
    });
    return NextResponse.json({ success: true, url: created.url, invite: created.invite });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation could not be sent.";
    const now = new Date().toISOString();
    if (supabase && inviteId) {
      await supabase.from("premium_invites").update({ revoked_at: now }).eq("id", inviteId);
    }
    if (supabase && claimedRequestId) {
      await supabase
        .from("invite_requests")
        .update({ status: "pending", invite_id: null, error_message: message })
        .eq("id", claimedRequestId)
        .eq("status", "processing");
    }
    if (supabase && recipient) {
      await supabase.from("email_logs").insert({
        recipient,
        subject: PREMIUM_INVITE_SUBJECT,
        status: "failed",
        error_message: message
      });
    }
    return NextResponse.json(
      { error: message },
      { status: message.includes("Admin") ? 403 : 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const now = new Date().toISOString();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("invite_requests")
      .update({ status: "declined", handled_by: admin.id, handled_at: now })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "This request was already handled." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request could not be declined.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Admin") ? 403 : 400 }
    );
  }
}
