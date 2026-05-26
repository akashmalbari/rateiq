"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.replace(next);
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
          }
        });
        if (signUpError) throw signUpError;
        setStatus("Check your email to confirm your account.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`
      });
      if (resetError) throw resetError;
      setStatus("Password reset instructions sent.");
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password";
  const button =
    mode === "login" ? "Login" : mode === "signup" ? "Create account" : "Send reset link";

  return (
    <form onSubmit={onSubmit} className="premium-panel w-full max-w-md space-y-5 p-6" data-testid={`${mode}-form`}>
      <div>
        <p className="data-label">Figure My Money</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-white">{title}</h1>
      </div>

      {mode === "signup" ? (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ada Lovelace" />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@domain.com" required />
      </div>

      {mode !== "reset" ? (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </div>
      ) : null}

      {error ? <p className="rounded-md border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p> : null}
      {status ? <p className="rounded-md border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-100">{status}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
        {button}
      </Button>

      <div className="flex items-center justify-between text-sm text-slate-500">
        {mode === "login" ? (
          <>
            <Link href="/signup" className="hover:text-white">Create account</Link>
            <Link href="/reset-password" className="hover:text-white">Forgot password?</Link>
          </>
        ) : (
          <Link href="/login" className="hover:text-white">Already have an account?</Link>
        )}
      </div>
    </form>
  );
}
