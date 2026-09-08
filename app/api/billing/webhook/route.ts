import { NextResponse } from "next/server";
import { retrieveAndSyncSubscription, syncStripeSubscription } from "@/lib/billing/service";
import {
  stripeObjectId,
  type StripeCheckoutSession,
  type StripeEvent,
  type StripeSubscription,
  verifyStripeWebhookSignature
} from "@/lib/billing/stripe";
import { requireServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkoutEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded"
]);
const subscriptionEvents = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed"
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = requireServerEnv("STRIPE_WEBHOOK_SECRET");
  if (!signature || !verifyStripeWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: processed } = await supabase
    .from("billing_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (processed) return NextResponse.json({ received: true, duplicate: true });

  try {
    const eventCreatedAt = new Date(event.created * 1000).toISOString();
    if (checkoutEvents.has(event.type)) {
      const session = event.data.object as StripeCheckoutSession;
      const subscriptionId = stripeObjectId(session.subscription);
      if (!subscriptionId) throw new Error("Checkout session has no subscription.");
      await retrieveAndSyncSubscription(
        subscriptionId,
        event.id,
        eventCreatedAt,
        session.client_reference_id ?? session.metadata?.user_id
      );
    } else if (subscriptionEvents.has(event.type)) {
      await syncStripeSubscription(
        event.data.object as StripeSubscription,
        event.id,
        eventCreatedAt
      );
    }

    const { error } = await supabase.from("billing_webhook_events").insert({
      id: event.id,
      event_type: event.type
    });
    if (error && error.code !== "23505") throw new Error(error.message);
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : error
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
