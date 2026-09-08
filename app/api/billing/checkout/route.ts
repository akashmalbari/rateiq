import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { ensureStripeCustomer, getBillingSubscription, subscriptionIsActive } from "@/lib/billing/service";
import { isBillingPlanId, requirePlanPriceId } from "@/lib/billing/plans";
import { createStripeCheckoutSession, createStripePortalSession } from "@/lib/billing/stripe";
import { publicEnv } from "@/lib/env";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const checkoutSchema = z.object({ plan: z.string().refine(isBillingPlanId) });

export async function POST(request: Request) {
  const limit = rateLimit(`billing-checkout:${getClientIp(request)}`, 8, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const user = await requireUser();
    const { plan } = checkoutSchema.parse(await request.json());
    const existing = await getBillingSubscription(user.id);

    if (existing?.stripe_customer_id && subscriptionIsActive(existing.status)) {
      const portal = await createStripePortalSession(
        existing.stripe_customer_id,
        `${publicEnv.NEXT_PUBLIC_APP_URL}/settings`
      );
      return NextResponse.json({ url: portal.url, destination: "portal" });
    }

    const customerId = await ensureStripeCustomer(user, plan);
    const session = await createStripeCheckoutSession({
      userId: user.id,
      customerId,
      plan,
      priceId: requirePlanPriceId(plan),
      successUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("subscriptions")
      .update({ stripe_checkout_session_id: session.id, tier: plan, status: "incomplete" })
      .eq("user_id", user.id);
    if (error) throw new Error(`Unable to save checkout session: ${error.message}`);

    return NextResponse.json({ url: session.url, destination: "checkout" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be started.";
    const status = message.includes("Authentication") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
