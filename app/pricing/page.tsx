import Link from "next/link";
import { Check, KeyRound, Layers3 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { PlanCheckoutButton } from "@/components/billing/plan-checkout-button";
import { InviteAccessForm } from "@/components/invites/invite-access-form";
import { getUserAccess } from "@/lib/auth/authorization";
import { billingEnabled, isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";

const plans = [
  {
    name: "Essential",
    price: "$6.99",
    description: "A focused daily shortlist delivered directly to your inbox.",
    features: ["10 ranked options ideas each trading day", "Strike, expiration, credit, APY, and trade plan", "Daily delivery through email"]
  },
  {
    name: "Premium",
    price: "$11.99",
    description: "The complete research and performance workspace.",
    features: ["Everything in Essential", "Options Dashboard", "Track Record and Paper Portfolio", "Backtesting strategy lab"]
  }
];

export default async function PricingPage({
  searchParams
}: {
  searchParams: Promise<{ required?: string; checkout?: string; access?: string }>;
}) {
  const params = await searchParams;
  const activeView = params.access === "invite" ? "invite" : "plans";
  const user = isSupabaseConfigured ? await getCurrentUser() : null;
  const access = user ? await getUserAccess(user) : null;
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-16">
        <Badge>Access</Badge>
        <h1 className="mt-5 font-heading text-4xl font-bold text-white">Choose how you join Figure My Money.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Paid subscriptions are being readied for launch. Private invitations are available now.
        </p>
        {params.required === "premium" ? (
          <div className="mt-6 rounded-md border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
            That feature is included with Premium. Administrators retain full access.
          </div>
        ) : null}
        {params.checkout === "cancelled" ? (
          <div className="mt-6 rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300">
            Checkout was cancelled. No subscription changes were made.
          </div>
        ) : null}
        <div className="mt-8 inline-flex rounded-md border border-white/10 bg-white/[0.035] p-1">
          <Link
            href="/pricing"
            className={`flex h-10 items-center gap-2 rounded-sm px-4 text-sm font-semibold transition-colors ${activeView === "plans" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"}`}
          >
            <Layers3 className="size-4" aria-hidden="true" />
            Plans
          </Link>
          <Link
            href="/pricing?access=invite"
            className={`flex h-10 items-center gap-2 rounded-sm px-4 text-sm font-semibold transition-colors ${activeView === "invite" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"}`}
          >
            <KeyRound className="size-4" aria-hidden="true" />
            Invite-only access
          </Link>
        </div>

        {activeView === "plans" ? (
          <div className="mt-6 grid max-w-4xl gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.name} className="premium-panel flex min-h-[390px] flex-col p-6">
                <p className="data-label">{plan.name}</p>
                <div className="mt-4 flex items-end gap-2">
                  <p className="font-heading text-4xl font-bold text-white">{plan.price}</p>
                  <span className="pb-1 text-sm text-slate-500">/ month</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-slate-300">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <PlanCheckoutButton
                  plan={plan.name === "Premium" ? "premium" : "essential"}
                  authenticated={Boolean(user)}
                  hasActiveSubscription={access?.hasActiveSubscription ?? false}
                  currentPlan={access?.subscriptionTier === "premium" ? "premium" : "essential"}
                  isAdmin={access?.isAdmin}
                  launchEnabled={billingEnabled}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <InviteAccessForm />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
