"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BillingPlanId } from "@/lib/billing/plans";

export function PlanCheckoutButton({
  plan,
  authenticated,
  hasActiveSubscription,
  currentPlan,
  isAdmin = false
}: {
  plan: BillingPlanId;
  authenticated: boolean;
  hasActiveSubscription: boolean;
  currentPlan?: BillingPlanId;
  isAdmin?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAdmin) {
    return (
      <Button className="mt-auto w-full" variant="secondary" disabled>
        Administrator access included
      </Button>
    );
  }

  if (!authenticated) {
    const next = encodeURIComponent(`/checkout?plan=${plan}`);
    return (
      <Button asChild className="mt-auto w-full" variant={plan === "premium" ? "default" : "secondary"}>
        <Link href={`/signup?plan=${plan}&next=${next}`}>
          Choose {plan === "premium" ? "Premium" : "Essential"}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  async function beginCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        hasActiveSubscription ? "/api/billing/portal" : "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: hasActiveSubscription ? undefined : JSON.stringify({ plan })
        }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.url) throw new Error(body.error ?? "Billing is unavailable.");
      window.location.assign(body.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Billing is unavailable.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-auto">
      <Button
        className="w-full"
        variant={plan === "premium" ? "default" : "secondary"}
        onClick={beginCheckout}
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
        {hasActiveSubscription
          ? currentPlan === plan ? "Manage current plan" : "Change plan in billing"
          : `Choose ${plan === "premium" ? "Premium" : "Essential"}`}
      </Button>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
