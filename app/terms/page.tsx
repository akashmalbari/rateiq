import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell max-w-4xl py-16">
        <h1 className="font-heading text-4xl font-bold text-white">Terms</h1>
        <p className="mt-6 text-sm leading-7 text-slate-400">
          By using Figure My Money, you agree that the service is provided for
          educational research, that all trading decisions are your own, and that
          platform availability, data freshness, model outputs, and email delivery
          may vary. Premium subscription billing can be connected to Stripe in a
          future release using the existing subscription tier architecture.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
