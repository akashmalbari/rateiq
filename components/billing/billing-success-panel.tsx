"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type BillingStatus = {
  active: boolean;
  tier: "essential" | "premium" | null;
  status: string;
};

export function BillingSuccessPanel() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  useEffect(() => {
    let stopped = false;
    let attempts = 0;
    async function refresh() {
      const response = await fetch("/api/billing/status", { cache: "no-store" });
      const data = response.ok ? ((await response.json()) as BillingStatus) : null;
      if (stopped) return;
      setBilling(data);
      attempts += 1;
      if (!data?.active && attempts < 10) window.setTimeout(refresh, 1500);
    }
    refresh();
    return () => {
      stopped = true;
    };
  }, []);

  const destination = billing?.tier === "premium" ? "/dashboard" : "/settings";
  return (
    <div className="premium-panel mx-auto max-w-xl p-7 text-center">
      {billing?.active ? (
        <CheckCircle2 className="mx-auto size-9 text-emerald-300" aria-hidden="true" />
      ) : (
        <Loader2 className="mx-auto size-9 animate-spin text-amber-300" aria-hidden="true" />
      )}
      <h1 className="mt-5 font-heading text-3xl font-bold text-white">
        {billing?.active ? "Subscription active" : "Confirming your subscription"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {billing?.active
          ? `Your ${billing.tier === "premium" ? "Premium" : "Essential"} access is ready.`
          : "Payment has returned successfully. Access will appear as soon as the signed billing event is verified."}
      </p>
      {billing?.active ? (
        <Button asChild className="mt-6">
          <Link href={destination}>Continue</Link>
        </Button>
      ) : null}
    </div>
  );
}
