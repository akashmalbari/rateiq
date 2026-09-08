import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { getBillingSubscription, subscriptionIsActive } from "@/lib/billing/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const subscription = await getBillingSubscription(user.id);
    return NextResponse.json({
      tier: subscription?.tier ?? null,
      status: subscription?.status ?? "inactive",
      active: subscriptionIsActive(subscription?.status),
      currentPeriodEnd: subscription?.current_period_end ?? null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription unavailable.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
