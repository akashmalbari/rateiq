import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { getBillingSubscription } from "@/lib/billing/service";
import { createStripePortalSession } from "@/lib/billing/stripe";
import { publicEnv } from "@/lib/env";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(`billing-portal:${getClientIp(request)}`, 12, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const user = await requireUser();
    const subscription = await getBillingSubscription(user.id);
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account exists yet." }, { status: 404 });
    }
    const session = await createStripePortalSession(
      subscription.stripe_customer_id,
      `${publicEnv.NEXT_PUBLIC_APP_URL}/settings`
    );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Billing portal unavailable.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Authentication") ? 401 : 400 }
    );
  }
}
