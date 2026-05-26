"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SettingsForm() {
  const [fullName, setFullName] = useState("");
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

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
        email_digest_enabled: digestEnabled,
        updated_at: new Date().toISOString()
      })
      .eq("id", data.user.id);
    setStatus("Profile saved.");
  }

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

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
      {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
      <div className="flex gap-3">
        <Button onClick={save}>Save settings</Button>
        <Button onClick={logout} variant="secondary">Logout</Button>
      </div>
    </div>
  );
}
