import { redirect } from "next/navigation";
import { PlanCheckoutButton } from "@/components/billing/plan-checkout-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { BILLING_PLANS, isBillingPlanId } from "@/lib/billing/plans";
import { getUserAccess } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const { plan: requestedPlan } = await searchParams;
  if (!isBillingPlanId(requestedPlan)) redirect("/pricing");
  const plan = BILLING_PLANS[requestedPlan];
  const access = await getUserAccess(user);

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-16">
        <div className="premium-panel mx-auto max-w-xl p-7">
          <Badge>Secure checkout</Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold text-white">Continue with {plan.name}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            ${plan.price.toFixed(2)} per month. Enter a promotion code on the Stripe checkout screen when applicable.
          </p>
          <div className="mt-8">
            <PlanCheckoutButton
              plan={requestedPlan}
              authenticated
              hasActiveSubscription={access.hasActiveSubscription}
              currentPlan={access.subscriptionTier === "premium" ? "premium" : "essential"}
              isAdmin={access.isAdmin}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
