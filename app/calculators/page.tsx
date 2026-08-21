import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import { InflationCalculator } from "@/components/inflation-calculator";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { getLatestCpiSnapshot } from "@/lib/inflation/bls";

export const metadata: Metadata = {
  title: "Inflation & Lifestyle Calculator",
  description:
    "Compare historical U.S. purchasing power, project future lifestyle costs, and estimate portfolio income while preserving purchasing power."
};

export default async function CalculatorsPage() {
  const latestCpi = await getLatestCpiSnapshot();

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-8 sm:py-10">
        <section className="border-b border-white/10 pb-8">
          <Badge variant="blue">Calculators</Badge>
          <div className="mt-4 flex items-start gap-4">
            <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-md border border-amber-300/25 bg-amber-300/10">
              <Calculator className="size-5 text-amber-300" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
                Inflation &amp; Lifestyle Calculator
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Translate dollars across more than a century of U.S. inflation, then estimate
                future lifestyle costs or portfolio income that preserves purchasing power.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8">
          <InflationCalculator latestCpi={latestCpi} />
        </section>

        <p className="pb-2 text-xs leading-5 text-slate-600">
          Source:{" "}
          <a
            className="text-slate-500 underline decoration-slate-700 underline-offset-2 hover:text-slate-300"
            href="https://www.bls.gov/cpi/"
            rel="noreferrer"
            target="_blank"
          >
            U.S. Bureau of Labor Statistics CPI-U
          </a>
          , U.S. city average, all items. Future results are hypothetical projections and are
          not guarantees of actual inflation or individual household costs.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
