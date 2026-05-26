"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LockKeyhole, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getDisplayName(user: User | null) {
  if (!user) return null;
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;
  return metadataName || user.email?.split("@")[0] || "Account";
}

export function AuthNavActions() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = createSupabaseBrowserClient();

      supabase.auth.getUser().then(({ data }) => {
        if (!mounted) return;
        setUser(data.user);
        setLoaded(true);
      });

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        setLoaded(true);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch {
      setLoaded(true);
      return () => {
        mounted = false;
      };
    }
  }, []);

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!loaded) {
    return <div className="h-8 w-28 animate-pulse rounded-md bg-white/10" />;
  }

  if (user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="hidden max-w-48 truncate sm:inline-flex">
          <Link href="/settings" data-testid="nav-account-link">
            <UserRound aria-hidden="true" />
            <span className="truncate">{getDisplayName(user)}</span>
          </Link>
        </Button>
        <Button onClick={logout} variant="secondary" size="sm" data-testid="logout-button">
          <LogOut aria-hidden="true" />
          Logout
        </Button>
      </>
    );
  }

  return (
    <>
      <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
        <Link href="/login">
          <LockKeyhole aria-hidden="true" />
          Login
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">
          <UserRound aria-hidden="true" />
          Start
        </Link>
      </Button>
    </>
  );
}
