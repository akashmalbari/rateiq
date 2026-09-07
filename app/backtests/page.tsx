import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { BacktestConsole } from "@/app/backtests/backtest-console";
import { getUserAccess } from "@/lib/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BacktestsPage() {
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/backtests");
    const access = await getUserAccess(user);
    if (!access.hasPremiumAccess) {
      redirect("/pricing?required=premium&next=/backtests");
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-10">
        <BacktestConsole />
      </main>
      <SiteFooter />
    </div>
  );
}
