"use client";

import { useEffect, useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Logs = {
  scans?: Array<{ id: string; scan_date: string; status: string; recommendation_count: number; started_at: string }>;
  emails?: Array<{ id: string; recipient: string; status: string; subject: string; created_at: string }>;
};

export function AdminConsole() {
  const [logs, setLogs] = useState<Logs>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    const response = await fetch("/api/admin/logs");
    if (response.ok) {
      setLogs(await response.json());
    }
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

  useEffect(() => {
    loadLogs();
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
