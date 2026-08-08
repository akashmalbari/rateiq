import { redirect } from "next/navigation";
import { AdminAccessDenied } from "@/components/admin-access-denied";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { AdminConsole } from "@/app/admin/admin-console";
import { requireAdmin } from "@/lib/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { getPaperPortfolioReport } from "@/lib/paper-trading/reporting";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let paperCapital: { availableCash: number; netContributions: number } | null = null;
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/admin");

    try {
      await requireAdmin();
    } catch {
      return <AdminAccessDenied email={user.email ?? "your current account"} />;
    }

    try {
      const report = await getPaperPortfolioReport();
      paperCapital = {
        availableCash: report.values.availableCash,
        netContributions: report.netContributions
      };
    } catch {
      paperCapital = null;
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-10">
        <AdminConsole paperCapital={paperCapital} />
      </main>
      <SiteFooter />
    </div>
  );
}
