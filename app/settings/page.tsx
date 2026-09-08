import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SettingsForm } from "@/app/settings/settings-form";
import { getUserAccess } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  const access = await getUserAccess(user);
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-10">
        <SettingsForm
          billing={{
            tier: access.subscriptionTier,
            status: access.billingStatus,
            active: access.hasActiveSubscription,
            currentPeriodEnd: access.currentPeriodEnd,
            cancelAtPeriodEnd: access.cancelAtPeriodEnd,
            isAdmin: access.isAdmin
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
