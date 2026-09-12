"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseInviteTokenInput } from "@/lib/invites/shared";

export function InviteAccessForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestComplete, setRequestComplete] = useState(false);

  async function requestInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequesting(true);
    setRequestError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/invite-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, company: form.get("company") || undefined })
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      setRequestComplete(true);
    } else {
      setRequestError(body.error ?? "Your request could not be submitted.");
    }
    setRequesting(false);
  }

  function continueToInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = parseInviteTokenInput(value);
    if (!token) {
      setError("Enter the complete invitation link or access token.");
      return;
    }
    window.location.assign(`/invite/${token}`);
  }

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <form onSubmit={requestInvitation} className="premium-panel p-6">
        <div className="flex size-10 items-center justify-center rounded-md border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
          <Mail className="size-5" aria-hidden="true" />
        </div>
        <p className="data-label mt-5">Request access</p>
        <h2 className="mt-3 font-heading text-2xl font-bold text-white">Ask for an invitation</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Submit your email for review. If approved, the administrator will send a private invitation from Figure My Money.
        </p>
        {requestComplete ? (
          <div className="mt-6 rounded-md border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
            Request received. Watch <strong>{email}</strong> for an invitation from Figure My Money.
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-2">
              <Label htmlFor="invite-request-email">Email address</Label>
              <Input
                id="invite-request-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] size-px opacity-0"
            />
            <Button type="submit" className="mt-4" disabled={requesting || !email.trim()}>
              <Mail aria-hidden="true" />
              {requesting ? "Sending request..." : "Request invitation"}
            </Button>
            {requestError ? <p className="mt-3 text-sm text-rose-300">{requestError}</p> : null}
          </>
        )}
      </form>

      <form onSubmit={continueToInvite} className="premium-panel p-6">
        <p className="data-label">Already invited</p>
        <h2 className="mt-3 font-heading text-2xl font-bold text-white">Activate an invitation</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Each invitation can be used once and unlocks Premium access for the private launch.
        </p>
        <div className="mt-6 space-y-2">
          <Label htmlFor="invite-token">Invitation link or token</Label>
          <Input
            id="invite-token"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://figuremymoney.com/invite/..."
            autoComplete="off"
          />
        </div>
        <Button type="submit" className="mt-4">
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </form>
    </div>
  );
}
