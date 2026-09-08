import { BillingSuccessPanel } from "@/components/billing/billing-success-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const dynamic = "force-dynamic";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-16">
        <BillingSuccessPanel />
      </main>
      <SiteFooter />
    </div>
  );
}
