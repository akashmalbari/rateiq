"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BillingSummary = {
  tier: string;
  status: string;
  active: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isAdmin: boolean;
  hasInviteAccess: boolean;
  hasAdminGrantAccess: boolean;
};

export function SettingsForm({ billing }: { billing: BillingSummary }) {
  const [fullName, setFullName] = useState("");
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("full_name,email_digest_enabled")
        .eq("id", data.user.id)
        .single();
      setFullName(profile?.full_name ?? data.user.user_metadata.full_name ?? "");
      setDigestEnabled(profile?.email_digest_enabled ?? true);
    });
  }, []);

  async function save() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase
      .from("users")
      .update({
        full_name: fullName,
        email_digest_enabled: digestEnabled
      })
      .eq("id", data.user.id);
    setStatus("Profile saved.");
  }

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function manageBilling() {
    setBillingLoading(true);
    setStatus(null);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.url) {
      window.location.assign(body.url);
      return;
    }
    setStatus(body.error ?? "Billing portal unavailable.");
    setBillingLoading(false);
  }

  const planName = billing.isAdmin
    ? "Administrator"
    : billing.hasInviteAccess
      ? "Premium private access"
      : billing.hasAdminGrantAccess
        ? "Premium administrator access"
      : billing.active
      ? billing.tier === "premium" ? "Premium" : "Essential"
      : "No active subscription";
  const renewal = billing.currentPeriodEnd
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(billing.currentPeriodEnd))
    : null;

  return (
    <div className="premium-panel max-w-2xl space-y-6 p-6">
      <div>
        <p className="data-label">Profile</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-white">Account settings</h1>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <div>
          <p className="font-medium text-white">Daily email digest</p>
          <p className="text-sm text-slate-500">Receive ranked trade ideas after each weekday scan.</p>
        </div>
        <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="data-label">Subscription</p>
            <p className="mt-2 font-heading text-lg font-semibold text-white">{planName}</p>
            <p className="mt-1 text-sm text-slate-500">
              {billing.isAdmin
                ? "Full product access is included with the administrator role."
                : billing.hasInviteAccess
                  ? "Premium access was activated with a private-launch invitation."
                : billing.hasAdminGrantAccess
                  ? "Premium access was granted directly by an administrator."
                : billing.active
                  ? `${billing.cancelAtPeriodEnd ? "Access ends" : "Renews"}${renewal ? ` ${renewal}` : " at the end of the billing period"}.`
                  : "Choose a plan to activate daily emails and research access."}
            </p>
          </div>
          {billing.active && !billing.isAdmin && !billing.hasInviteAccess && !billing.hasAdminGrantAccess ? (
            <Button onClick={manageBilling} variant="secondary" disabled={billingLoading}>
              {billingLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
              Manage billing
            </Button>
          ) : !billing.isAdmin && !billing.hasInviteAccess && !billing.hasAdminGrantAccess ? (
            <Button asChild variant="secondary">
              <Link href="/pricing">View plans</Link>
            </Button>
          ) : null}
        </div>
      </div>
      {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
      <div className="flex gap-3">
        <Button onClick={save}>Save settings</Button>
        <Button onClick={logout} variant="secondary">Logout</Button>
      </div>
    </div>
  );
}
