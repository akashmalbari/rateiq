import Link from "next/link";
import { KeyRound } from "lucide-react";
import { RedeemInviteButton } from "@/components/invites/redeem-invite-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseInviteTokenInput } from "@/lib/invites/shared";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: rawToken } = await params;
  const token = parseInviteTokenInput(rawToken);
  const user = await getCurrentUser();
  const next = encodeURIComponent(`/invite/${rawToken}`);

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-16">
        <div className="premium-panel mx-auto max-w-xl p-7">
          <div className="flex size-10 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-200">
            <KeyRound className="size-5" aria-hidden="true" />
          </div>
          <Badge className="mt-5">Invite-only access</Badge>
          <h1 className="mt-4 font-heading text-3xl font-bold text-white">Welcome to the private launch.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This one-time invitation unlocks the Options Dashboard, Track Record, Paper Portfolio, Backtests, and daily ideas.
          </p>

          {!token ? (
            <p className="mt-6 rounded-md border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
              This invitation link is not valid.
            </p>
          ) : user ? (
            <div className="mt-7">
              <p className="mb-4 text-sm text-slate-300">Activating for <strong className="text-white">{user.email}</strong></p>
              <RedeemInviteButton token={token} />
            </div>
          ) : (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button asChild>
                <Link href={`/signup?next=${next}`}>Create account</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/login?next=${next}`}>Log in</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
