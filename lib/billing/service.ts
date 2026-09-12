import type { User } from "@supabase/supabase-js";
import { BILLING_PLANS, planFromPriceId, type BillingPlanId } from "@/lib/billing/plans";
import {
  createStripeCustomer,
  retrieveStripeSubscription,
  stripeObjectId,
  type StripeSubscription
} from "@/lib/billing/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function subscriptionIsActive(status: string | null | undefined) {
  return Boolean(status && ACTIVE_SUBSCRIPTION_STATUSES.has(status));
}

export function stripeTimestamp(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

export function subscriptionPeriodEnd(subscription: StripeSubscription) {
  const periods = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");
  return periods.length ? Math.max(...periods) : null;
}

export async function getBillingSubscription(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load subscription: ${error.message}`);
  return data;
}

export async function ensureStripeCustomer(user: User, plan: BillingPlanId) {
  const supabase = createSupabaseAdminClient();
  const existing = await getBillingSubscription(user.id);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await createStripeCustomer(user);
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      tier: plan,
      status: "incomplete",
      stripe_customer_id: customer.id
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(`Unable to save billing customer: ${error.message}`);
  return customer.id;
}

async function resolveSubscriptionUserId(subscription: StripeSubscription) {
  const metadataUserId = subscription.metadata?.user_id;
  if (metadataUserId) return metadataUserId;

  const supabase = createSupabaseAdminClient();
  const customerId = stripeObjectId(subscription.customer);
  const bySubscription = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (bySubscription.data?.user_id) return bySubscription.data.user_id;

  if (customerId) {
    const byCustomer = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (byCustomer.data?.user_id) return byCustomer.data.user_id;
  }
  return null;
}

export async function syncStripeSubscription(
  subscription: StripeSubscription,
  eventId: string,
  eventCreatedAt: string,
  fallbackUserId?: string | null
) {
  const userId = fallbackUserId ?? (await resolveSubscriptionUserId(subscription));
  if (!userId) throw new Error(`No application user is linked to ${subscription.id}.`);

  const priceId = subscription.items.data[0]?.price.id;
  const metadataTier = subscription.metadata?.tier;
  const tier = (
    planFromPriceId(priceId) ??
    (metadataTier === "essential" || metadataTier === "premium" ? metadataTier : null)
  ) as BillingPlanId | null;
  if (!tier || !BILLING_PLANS[tier]) {
    throw new Error(`Stripe price ${priceId ?? "unknown"} is not mapped to an application plan.`);
  }

  const customerId = stripeObjectId(subscription.customer);
  if (!customerId || !priceId) throw new Error("Stripe subscription is missing billing identifiers.");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("sync_billing_subscription", {
    p_user_id: userId,
    p_tier: tier,
    p_status: subscription.status,
    p_customer_id: customerId,
    p_subscription_id: subscription.id,
    p_price_id: priceId,
    p_period_end: stripeTimestamp(subscriptionPeriodEnd(subscription)),
    p_cancel_at_period_end: Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
    p_canceled_at: stripeTimestamp(subscription.canceled_at),
    p_trial_end: stripeTimestamp(subscription.trial_end),
    p_event_id: eventId,
    p_event_created_at: eventCreatedAt
  });
  if (error) throw new Error(`Unable to synchronize subscription: ${error.message}`);

  const { error: profileError } = await supabase
    .from("users")
    .update({ access_granted_at: null, access_granted_by: null })
    .eq("id", userId);
  if (profileError) throw new Error(`Unable to synchronize account access: ${profileError.message}`);
  return { userId, tier, status: subscription.status };
}

export async function retrieveAndSyncSubscription(
  subscriptionId: string,
  eventId: string,
  eventCreatedAt: string,
  fallbackUserId?: string | null
) {
  const subscription = await retrieveStripeSubscription(subscriptionId);
  return syncStripeSubscription(subscription, eventId, eventCreatedAt, fallbackUserId);
}
