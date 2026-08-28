"use client";

import { useEffect, useState } from "react";
import { ListChecks, Play, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaperCapitalControl } from "@/components/paper-capital-control";
import { MAX_ADMIN_PICK_SYMBOLS, parseTickerList } from "@/lib/trading/ticker-list";

type Logs = {
  scans?: Array<{ id: string; scan_date: string; status: string; recommendation_count: number; started_at: string }>;
  emails?: Array<{ id: string; recipient: string; status: string; subject: string; created_at: string }>;
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
    setStatus(response.ok ? `Scan complete: ${body.scan.recommendations.length} picks.` : body.error);
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

  useEffect(() => {
    loadLogs();
    loadAdminPicks();
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
