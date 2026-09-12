"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RedeemInviteButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function redeem() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/invites/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      window.location.assign("/dashboard?invite=accepted");
      return;
    }
    setError(body.error ?? "Invitation could not be redeemed.");
    setLoading(false);
  }

  return (
    <div>
      <Button onClick={redeem} disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
        {loading ? "Activating..." : "Activate Premium access"}
      </Button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
