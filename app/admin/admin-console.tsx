"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, ListChecks, Play, RefreshCw, Save, Search, TicketPercent, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaperCapitalControl } from "@/components/paper-capital-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_ADMIN_PICK_SYMBOLS, parseTickerList } from "@/lib/trading/ticker-list";

type Logs = {
  scans?: Array<{ id: string; scan_date: string; status: string; recommendation_count: number; started_at: string }>;
  emails?: Array<{ id: string; recipient: string; status: string; subject: string; created_at: string }>;
};

type Coupon = {
  id: string;
  code: string;
  percent_off: number;
  duration: "once" | "forever";
  max_redemptions: number | null;
  expires_at: string | null;
  active: boolean;
  times_redeemed: number;
};

type PremiumInvite = {
  id: string;
  token_prefix: string;
  note: string | null;
  expires_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
  created_at: string;
  status: "available" | "redeemed" | "expired" | "revoked";
};

type Subscriber = {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  plan: "essential" | "premium" | "enterprise";
  accessSource: "administrator" | "invitation" | "subscription" | "none";
  billingStatus: string;
  currentPeriodEnd: string | null;
  emailDigestEnabled: boolean;
  deliveryEligible: boolean;
  latestDeliveryState: "sent" | "queued" | "failed" | "skipped" | "missing" | "opted_out" | "no_access" | "not_due";
  lastSentAt: string | null;
  lastAttempt: {
    status: string;
    createdAt: string;
    subject: string;
    error: string | null;
  } | null;
};

type LatestScan = { id: string; scan_date: string; started_at: string };

const deliveryStateDisplay: Record<
  Subscriber["latestDeliveryState"],
  { label: string; variant: "success" | "danger" | "default" | "blue" | "muted" }
> = {
  sent: { label: "Sent", variant: "success" },
  queued: { label: "Queued", variant: "blue" },
  failed: { label: "Failed", variant: "danger" },
  skipped: { label: "Skipped", variant: "default" },
  missing: { label: "Missing", variant: "danger" },
  opted_out: { label: "Opted out", variant: "muted" },
  no_access: { label: "No active access", variant: "default" },
  not_due: { label: "Not due", variant: "muted" }
};

export function AdminConsole({
  paperCapital
}: {
  paperCapital?: { availableCash: number; netContributions: number } | null;
}) {
  const [logs, setLogs] = useState<Logs>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tickerInput, setTickerInput] = useState("");
  const [savingPicks, setSavingPicks] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [percentOff, setPercentOff] = useState("20");
  const [couponDuration, setCouponDuration] = useState<"once" | "forever">("once");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [invites, setInvites] = useState<PremiumInvite[]>([]);
  const [inviteNote, setInviteNote] = useState("");
  const [inviteDays, setInviteDays] = useState("30");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [savingInvite, setSavingInvite] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [latestSubscriberScan, setLatestSubscriberScan] = useState<LatestScan | null>(null);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const parsedTickers = parseTickerList(tickerInput);
  const visibleSubscribers = subscribers.filter((subscriber) => {
    const query = subscriberSearch.trim().toLowerCase();
    return !query || subscriber.email.toLowerCase().includes(query) || subscriber.fullName?.toLowerCase().includes(query);
  });

  async function loadLogs() {
    const response = await fetch("/api/admin/logs");
    if (response.ok) {
      setLogs(await response.json());
      return;
    }

    const body = await response.json().catch(() => ({}));
    setStatus(body.error ?? "Admin logs unavailable.");
  }

  async function triggerScan() {
    setLoading(true);
    setStatus("Running scan...");
    const response = await fetch("/api/scans/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxRecommendations: 15 })
    });
    const body = await response.json();
    if (response.ok) {
      const recommendations = body.scan.recommendations as Array<{ universeGroup?: string }>;
      const adminPickCount = recommendations.filter(
        (recommendation) => recommendation.universeGroup === "admin_picks"
      ).length;
      const warning = (body.scan.warnings as string[] | undefined)?.[0];
      setStatus(
        `Scan complete: ${recommendations.length} picks, including ${adminPickCount} Admin's Picks.${warning ? ` Warning: ${warning}` : ""}`
      );
    } else {
      setStatus(body.error);
    }
    setLoading(false);
    await loadLogs();
  }

  async function loadAdminPicks() {
    const response = await fetch("/api/admin/picks", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(body.error ?? "Admin's Picks could not be loaded.");
      return;
    }
    setTickerInput((body.symbols ?? []).join(", "));
  }

  async function saveAdminPicks() {
    if (parsedTickers.invalid.length || parsedTickers.exceedsLimit) return;
    setSavingPicks(true);
    setStatus("Saving Admin's Picks...");
    const response = await fetch("/api/admin/picks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: parsedTickers.symbols })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setTickerInput((body.symbols ?? []).join(", "));
      setStatus(`${body.symbols.length} Admin's Picks saved. They will be used by the next scan.`);
    } else {
      setStatus(body.error ?? "Admin's Picks could not be saved.");
    }
    setSavingPicks(false);
  }

  async function loadCoupons() {
    const response = await fetch("/api/admin/coupons", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) setCoupons(body.coupons ?? []);
  }

  async function createCoupon() {
    setSavingCoupon(true);
    setStatus("Creating promotion code...");
    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponCode,
        percentOff,
        duration: couponDuration,
        maxRedemptions: maxRedemptions || undefined,
        expiresAt: couponExpiry ? new Date(couponExpiry).toISOString() : undefined
      })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setStatus(`${body.coupon.code} is ready for Stripe Checkout.`);
      setCouponCode("");
      await loadCoupons();
    } else {
      setStatus(body.error ?? "Promotion code could not be created.");
    }
    setSavingCoupon(false);
  }

  async function deactivateCoupon(coupon: Coupon) {
    setStatus(`Deactivating ${coupon.code}...`);
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    setStatus(response.ok ? `${coupon.code} is no longer redeemable.` : body.error ?? "Coupon could not be deactivated.");
    if (response.ok) await loadCoupons();
  }

  async function loadInvites() {
    const response = await fetch("/api/admin/invites", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) setInvites(body.invites ?? []);
  }

  async function loadSubscribers() {
    const response = await fetch("/api/admin/subscribers", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setSubscribers(body.subscribers ?? []);
      setLatestSubscriberScan(body.latestScan ?? null);
      return;
    }
    setStatus(body.error ?? "Subscribers could not be loaded.");
  }

  async function refreshOperations() {
    await Promise.all([loadLogs(), loadSubscribers()]);
  }

  async function createInvite() {
    setSavingInvite(true);
    setGeneratedInviteUrl(null);
    setStatus("Generating one-time invitation...");
    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: inviteNote || undefined,
        expiresInDays: Number(inviteDays)
      })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setGeneratedInviteUrl(body.url);
      setInviteNote("");
      setStatus("Invitation generated. Copy it now; the full link is not stored.");
      await loadInvites();
    } else {
      setStatus(body.error ?? "Invitation could not be generated.");
    }
    setSavingInvite(false);
  }

  async function copyInvite() {
    if (!generatedInviteUrl) return;
    await navigator.clipboard.writeText(generatedInviteUrl);
    setStatus("Invitation link copied.");
  }

  async function revokeInvite(invite: PremiumInvite) {
    setStatus("Revoking invitation...");
    const response = await fetch(`/api/admin/invites/${invite.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    setStatus(response.ok ? "Invitation revoked." : body.error ?? "Invitation could not be revoked.");
    if (response.ok) await loadInvites();
  }

  useEffect(() => {
    loadLogs();
    loadAdminPicks();
    loadCoupons();
    loadInvites();
    loadSubscribers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge>Admin</Badge>
          <h1 className="mt-4 font-heading text-4xl font-bold text-white">Operations Console</h1>
          <p className="mt-3 text-sm text-slate-400">Trigger scans, monitor logs, and manage strategy health.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshOperations} variant="secondary">
            <RefreshCw aria-hidden="true" />
            Refresh
          </Button>
          <Button onClick={triggerScan} disabled={loading} data-testid="manual-scan-button">
            <Play aria-hidden="true" />
            Trigger scan
          </Button>
        </div>
      </div>

      {status ? <div className="rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">{status}</div> : null}

      {paperCapital ? (
        <PaperCapitalControl
          availableCash={paperCapital.availableCash}
          netContributions={paperCapital.netContributions}
        />
      ) : null}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Subscribers</CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Account access and daily-email status. Latest digest results refer to the
              {latestSubscriberScan ? ` ${latestSubscriberScan.scan_date}` : " most recent"} completed scan.
            </p>
          </div>
          <Users className="mt-1 size-5 shrink-0 text-emerald-300" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <Input
              aria-label="Search subscribers"
              value={subscriberSearch}
              onChange={(event) => setSubscriberSearch(event.target.value)}
              placeholder="Search name or email"
              className="pl-9"
            />
          </div>
          <div className="overflow-x-auto rounded-md border border-white/10">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-white/[0.035] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Subscriber</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3">Daily email</th>
                  <th className="px-4 py-3">Latest digest</th>
                  <th className="px-4 py-3">Last sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {visibleSubscribers.map((subscriber) => {
                  const delivery = deliveryStateDisplay[subscriber.latestDeliveryState];
                  return (
                    <tr key={subscriber.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{subscriber.fullName || "Unnamed account"}</p>
                        <p className="mt-1 text-xs text-slate-500">{subscriber.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={subscriber.plan === "premium" ? "blue" : "muted"}>
                          {subscriber.plan.charAt(0).toUpperCase() + subscriber.plan.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="capitalize text-slate-200">{subscriber.accessSource.replace("_", " ")}</p>
                        <p className="mt-1 text-xs capitalize text-slate-500">{subscriber.billingStatus}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={subscriber.emailDigestEnabled ? "success" : "muted"}>
                          {subscriber.emailDigestEnabled ? "Opted in" : "Opted out"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={delivery.variant}>{delivery.label}</Badge>
                        {subscriber.latestDeliveryState === "missing" ? (
                          <p className="mt-1 text-xs text-rose-300">Eligible, but no send was recorded.</p>
                        ) : null}
                        {subscriber.lastAttempt?.error ? (
                          <p className="mt-1 max-w-[240px] text-xs text-rose-300">{subscriber.lastAttempt.error}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {subscriber.lastSentAt ? new Date(subscriber.lastSentAt).toLocaleString() : "Never"}
                      </td>
                    </tr>
                  );
                })}
                {!visibleSubscribers.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {subscribers.length ? "No subscribers match that search." : "No subscriber accounts found."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Admin&apos;s Picks</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Paste up to 100 stock or ETF tickers. Separate them with commas, spaces,
              semicolons, or new lines. The next scan applies the standard NASDAQ-100 rules.
            </p>
          </div>
          <ListChecks className="mt-1 size-5 shrink-0 text-sky-300" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <textarea
            aria-label="Admin's Picks ticker symbols"
            value={tickerInput}
            onChange={(event) => setTickerInput(event.target.value)}
            rows={6}
            placeholder="AAPL, MSFT, NVDA, AMD"
            className="w-full resize-y rounded-md border border-white/10 bg-[#0B0E14] px-4 py-3 font-mono text-sm uppercase leading-6 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/15"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <span className={parsedTickers.exceedsLimit ? "text-rose-300" : "text-slate-400"}>
                {parsedTickers.symbols.length} / {MAX_ADMIN_PICK_SYMBOLS} unique tickers
              </span>
              {parsedTickers.invalid.length ? (
                <p className="mt-1 text-rose-300">
                  Invalid: {parsedTickers.invalid.join(", ")}
                </p>
              ) : null}
              {parsedTickers.exceedsLimit ? (
                <p className="mt-1 text-rose-300">Remove tickers until the list is at or below 100.</p>
              ) : null}
            </div>
            <Button
              onClick={saveAdminPicks}
              disabled={savingPicks || parsedTickers.invalid.length > 0 || parsedTickers.exceedsLimit}
            >
              <Save aria-hidden="true" />
              {savingPicks ? "Saving..." : "Save picks"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Premium Invitations</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Generate one-time private-launch links. A redeemed invitation grants Premium until it is revoked.
            </p>
          </div>
          <KeyRound className="mt-1 size-5 shrink-0 text-amber-300" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="invite-days">Redeem within</Label>
              <select
                id="invite-days"
                value={inviteDays}
                onChange={(event) => setInviteDays(event.target.value)}
                className="flex h-10 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-note">Note (optional)</Label>
              <Input
                id="invite-note"
                value={inviteNote}
                onChange={(event) => setInviteNote(event.target.value)}
                maxLength={200}
                placeholder="Early access cohort"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={createInvite} disabled={savingInvite}>
              <KeyRound aria-hidden="true" />
              {savingInvite ? "Generating..." : "Generate invite"}
            </Button>
            {generatedInviteUrl ? (
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 p-2">
                <code className="min-w-0 flex-1 truncate px-2 text-xs text-emerald-100">{generatedInviteUrl}</code>
                <Button size="sm" variant="secondary" onClick={copyInvite} aria-label="Copy invitation link">
                  <Copy aria-hidden="true" />
                  Copy
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 overflow-x-auto rounded-md border border-white/10">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.035] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invite</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Redeem by</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-white">{invite.token_prefix}...</p>
                      {invite.note ? <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">{invite.note}</p> : null}
                    </td>
                    <td className="px-4 py-3">{new Date(invite.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(invite.expires_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={invite.status === "redeemed" ? "success" : invite.status === "available" ? "blue" : "muted"}>
                        {invite.status}
                      </Badge>
                      {invite.redeemed_at ? <p className="mt-1 text-xs text-slate-500">{new Date(invite.redeemed_at).toLocaleString()}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {invite.status !== "revoked" ? (
                        <Button size="sm" variant="ghost" onClick={() => revokeInvite(invite)}>
                          <XCircle aria-hidden="true" />
                          Revoke
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!invites.length ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No invitations generated yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Subscription Coupons</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Create percentage promotion codes that customers can enter during Stripe Checkout.
            </p>
          </div>
          <TicketPercent className="mt-1 size-5 shrink-0 text-emerald-300" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="coupon-code">Promotion code</Label>
              <Input
                id="coupon-code"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="WELCOME20"
                maxLength={24}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percent-off">Percent off</Label>
              <Input id="percent-off" type="number" min="1" max="100" step="0.01" value={percentOff} onChange={(event) => setPercentOff(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-duration">Applies</Label>
              <select
                id="coupon-duration"
                value={couponDuration}
                onChange={(event) => setCouponDuration(event.target.value as "once" | "forever")}
                className="flex h-10 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                <option value="once">First invoice</option>
                <option value="forever">Every invoice</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-redemptions">Redemption limit</Label>
              <Input id="max-redemptions" type="number" min="1" value={maxRedemptions} onChange={(event) => setMaxRedemptions(event.target.value)} placeholder="Unlimited" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coupon-expiry">Expires (optional)</Label>
              <Input id="coupon-expiry" type="datetime-local" value={couponExpiry} onChange={(event) => setCouponExpiry(event.target.value)} />
            </div>
            <div className="flex items-end md:col-span-2 lg:col-span-3">
              <Button
                onClick={createCoupon}
                disabled={savingCoupon || couponCode.length < 3 || Number(percentOff) <= 0 || Number(percentOff) > 100}
              >
                <TicketPercent aria-hidden="true" />
                {savingCoupon ? "Creating..." : "Create coupon"}
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-md border border-white/10">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-white/[0.035] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Redemptions</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-white">{coupon.code}</td>
                    <td className="px-4 py-3">{coupon.percent_off}%</td>
                    <td className="px-4 py-3">{coupon.duration === "once" ? "First invoice" : "Every invoice"}</td>
                    <td className="px-4 py-3">{coupon.times_redeemed}{coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ""}</td>
                    <td className="px-4 py-3">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : "Never"}</td>
                    <td className="px-4 py-3 text-right">
                      {coupon.active ? (
                        <Button size="sm" variant="ghost" onClick={() => deactivateCoupon(coupon)}>
                          <XCircle aria-hidden="true" />
                          Deactivate
                        </Button>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {!coupons.length ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No promotion codes created yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(logs.scans ?? []).map((scan) => (
              <div key={scan.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm">
                <div>
                  <p className="font-medium text-white">{scan.scan_date}</p>
                  <p className="text-slate-500">{new Date(scan.started_at).toLocaleString()}</p>
                </div>
                <Badge variant={scan.status === "completed" ? "success" : "muted"}>{scan.recommendation_count} picks</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(logs.emails ?? []).map((email) => (
              <div key={email.id} className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-medium text-white">{email.recipient}</p>
                  <Badge variant={email.status === "sent" ? "success" : "danger"}>{email.status}</Badge>
                </div>
                <p className="mt-1 truncate text-slate-500">{email.subject}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
