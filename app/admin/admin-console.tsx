"use client";

import { useEffect, useState } from "react";
import { ListChecks, Play, RefreshCw, Save, TicketPercent, XCircle } from "lucide-react";
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
  const parsedTickers = parseTickerList(tickerInput);

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

  useEffect(() => {
    loadLogs();
    loadAdminPicks();
    loadCoupons();
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
          <Button onClick={loadLogs} variant="secondary">
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
