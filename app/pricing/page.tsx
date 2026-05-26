import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-16">
        <Badge>Pricing</Badge>
        <h1 className="mt-5 font-heading text-4xl font-bold text-white">Simple tiers for disciplined traders.</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ["Free", "$0", "Top 3 daily picks, daily email digest, core dashboard."],
            ["Premium", "$29/mo", "Top 10 picks, full analytics, backtests, journaling, paper trading."],
            ["Desk", "Custom", "Multi-user controls, higher-frequency scans, custom thresholds."]
          ].map(([name, price, copy]) => (
            <div key={name} className="premium-panel p-6">
              <p className="data-label">{name}</p>
              <p className="mt-4 font-heading text-4xl font-bold text-white">{price}</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">{copy}</p>
              <Button asChild className="mt-6 w-full" variant={name === "Premium" ? "default" : "secondary"}>
                <Link href="/signup">Start {name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
