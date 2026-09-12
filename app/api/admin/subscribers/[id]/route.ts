import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import { requirePlanPriceId } from "@/lib/billing/plans";
import { subscriptionIsActive, syncStripeSubscription } from "@/lib/billing/service";
import {
  changeStripeSubscriptionPrice,
  retrieveStripeSubscription,
  scheduleStripeSubscriptionCancellation
} from "@/lib/billing/stripe";
import { adminEmails } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const paramsSchema = z.object({ id: z.string().uuid() });
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_email"), enabled: z.boolean() }),
  z.object({ action: z.literal("set_access"), active: z.boolean() }),
  z.object({ action: z.literal("upgrade_premium") }),
  z.object({ action: z.literal("cancel_renewal") })
]);

type AdminAction =
  | "access_activated"
  | "access_deactivated"
  | "email_opted_in"
  | "email_opted_out"
  | "premium_granted"
  | "stripe_upgraded"
  | "stripe_cancellation_scheduled";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(`admin-subscriber:${getClientIp(request)}`, 40, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const admin = await requireAdmin();
    const { id } = paramsSchema.parse(await params);
    const input = actionSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();
    const [{ data: target, error: targetError }, { data: subscription, error: subscriptionError }] =
      await Promise.all([
        supabase
          .from("users")
          .select("id,email,role,subscription_tier,email_digest_enabled,access_status")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", id).maybeSingle()
      ]);

    if (targetError) throw new Error(targetError.message);
    if (subscriptionError) throw new Error(subscriptionError.message);
    if (!target) return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
    if (target.role === "admin" || adminEmails.includes(target.email.toLowerCase())) {
      return NextResponse.json({ error: "Administrator accounts cannot be changed here." }, { status: 400 });
    }

    let action: AdminAction;
    let message: string;
    let details: Record<string, unknown> = {};

    if (input.action === "set_email") {
      const { error } = await supabase
        .from("users")
        .update({ email_digest_enabled: input.enabled })
        .eq("id", id);
      if (error) throw new Error(error.message);
      action = input.enabled ? "email_opted_in" : "email_opted_out";
      message = input.enabled ? "Daily email enabled." : "Daily email disabled.";
      details = { previous: target.email_digest_enabled, next: input.enabled };
    } else if (input.action === "set_access") {
      const nextStatus = input.active ? "active" : "inactive";
      const { error } = await supabase
        .from("users")
        .update({ access_status: nextStatus })
        .eq("id", id);
      if (error) throw new Error(error.message);
      action = input.active ? "access_activated" : "access_deactivated";
      message = input.active
        ? "Account access activated."
        : "Account access deactivated. Stripe billing is unchanged.";
      details = { previous: target.access_status, next: nextStatus };
    } else if (input.action === "upgrade_premium") {
      if (subscription?.stripe_subscription_id && subscriptionIsActive(subscription.status)) {
        const current = await retrieveStripeSubscription(subscription.stripe_subscription_id);
        const updated = await changeStripeSubscriptionPrice(current, {
          priceId: requirePlanPriceId("premium"),
          plan: "premium"
        });
        await syncStripeSubscription(
          updated,
          `admin_plan_${crypto.randomUUID()}`,
          new Date().toISOString(),
          id
        );
        await supabase.from("users").update({ access_status: "active" }).eq("id", id);
        action = "stripe_upgraded";
        message = "Stripe subscription upgraded to Premium. The new rate begins at renewal.";
        details = { previousTier: subscription.tier, nextTier: "premium", proration: "none" };
      } else {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from("users")
          .update({
            subscription_tier: "premium",
            access_status: "active",
            access_granted_at: now,
            access_granted_by: admin.id
          })
          .eq("id", id);
        if (error) throw new Error(error.message);
        action = "premium_granted";
        message = "Premium access granted administratively. No Stripe charge was created.";
        details = { previousTier: target.subscription_tier, nextTier: "premium" };
      }
    } else {
      if (!subscription?.stripe_subscription_id) {
        return NextResponse.json({ error: "This account has no Stripe subscription to cancel." }, { status: 400 });
      }
      const updated = await scheduleStripeSubscriptionCancellation(subscription.stripe_subscription_id);
      await syncStripeSubscription(
        updated,
        `admin_cancel_${crypto.randomUUID()}`,
        new Date().toISOString(),
        id
      );
      action = "stripe_cancellation_scheduled";
      message = "Stripe renewal canceled. Access remains active through the paid period.";
      details = { currentPeriodEnd: subscription.current_period_end };
    }

    const { error: auditError } = await supabase.from("subscriber_admin_actions").insert({
      target_user_id: id,
      admin_user_id: admin.id,
      action,
      details
    });
    if (auditError) {
      logger.error("Subscriber admin action audit failed", {
        targetUserId: id,
        action,
        error: auditError.message
      });
    }

    return NextResponse.json({ success: true, message, auditRecorded: !auditError });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscriber could not be updated.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Admin access") ? 403 : 400 }
    );
  }
}
