"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseInviteTokenInput } from "@/lib/invites/shared";

export function InviteAccessForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={continueToInvite} className="premium-panel max-w-2xl p-6">
      <p className="data-label">Private launch</p>
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
  );
}
