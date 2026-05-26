import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BarChart3,
  Database,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { EquityCurveChart } from "@/components/charts/performance-chart";
import { AuthErrorRedirect } from "@/app/page-client";

const features = [
  { icon: TimerReset, title: "10:30 AM ET scans", copy: "Weekday Vercel Cron scans run after the market has established opening range context." },
  { icon: BarChart3, title: "Probability ranking", copy: "Trades are sorted by POP, liquidity, trend alignment, IV percentile, win-rate estimate, and bounded risk." },
  { icon: ShieldCheck, title: "Risk first", copy: "Every idea includes max risk, max reward, exits, stop logic, and suggested sizing." },
  { icon: Mail, title: "Premium digest", copy: "Top opportunities are delivered through Resend with concise reasoning and warnings." },
  { icon: Database, title: "Supabase system of record", copy: "Recommendations, outcomes, backtests, email logs, and users live in PostgreSQL." },
  { icon: SlidersHorizontal, title: "Pluggable strategies", copy: "Cash-secured puts, spreads, condors, and directional contracts share one extensible engine." }
];

const steps = [
  "Scan NASDAQ-100 symbols and options chains",
  "Filter earnings risk, liquidity, spread quality, volume, and open interest",
  "Score strategies by regime, IV, trend, Greeks, expected move, and history",
  "Rank ideas, store them, email subscribers, and update the dashboard"
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <Suspense fallback={null}>
        <AuthErrorRedirect />
      </Suspense>
      <SiteNav />
      <main>
        <section
          className="relative min-h-[88vh] overflow-hidden border-b border-white/10 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(8,11,16,.94) 0%, rgba(8,11,16,.74) 48%, rgba(8,11,16,.46) 100%), url('https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/a7387564404e56dc2465334c86a6584ef63a96bc7d21440c169cb0c955af4481.png')"
          }}
        >
          <div className="container-shell flex min-h-[88vh] items-center py-16">
            <div className="max-w-3xl">
              <Badge variant="success">NASDAQ-100 options intelligence</Badge>
              <h1 className="mt-6 max-w-4xl font-heading text-5xl font-extrabold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Figure My Money
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Daily high-probability options trade ideas built around statistical
                repeatability, risk controls, liquidity, and clear execution plans.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" data-testid="hero-start-button">
                  <Link href="/signup">
                    Start scanning
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard">View dashboard</Link>
                </Button>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ["10:30", "ET scan"],
                  ["3-10", "ranked picks"],
                  ["0", "hype factor"]
                ].map(([value, label]) => (
                  <div key={label} className="border-l border-white/15 pl-4">
                    <p className="font-mono text-2xl font-bold text-amber-300">{value}</p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container-shell py-16 md:py-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="premium-panel p-6">
                <feature.icon className="size-5 text-amber-300" aria-hidden="true" />
                <h2 className="mt-5 font-heading text-xl font-bold text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#101722]/70 py-16 md:py-24">
          <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge variant="blue">How it works</Badge>
              <h2 className="mt-5 font-heading text-4xl font-bold tracking-normal text-white">
                Quant workflow, retail-simple output.
              </h2>
              <div className="mt-8 grid gap-3">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-300 text-sm font-bold text-slate-950">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="premium-panel p-5">
              <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="data-label">Sample Backtest Curve</p>
                  <h3 className="mt-2 font-heading text-2xl font-bold text-white">Defined-risk model basket</h3>
                </div>
                <Badge variant="success">Illustrative</Badge>
              </div>
              <EquityCurveChart />
            </div>
          </div>
        </section>

        <section className="container-shell py-16 md:py-24">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              ["Free", "$0", "Top 3 daily picks, email digest, basic dashboard"],
              ["Premium", "$29", "Top 10 picks, advanced analytics, backtests, paper journal"],
              ["Desk", "Custom", "Team workflows, higher-frequency scans, priority data integrations"]
            ].map(([name, price, copy]) => (
              <div key={name} className="premium-panel p-6">
                <p className="data-label">{name}</p>
                <p className="mt-4 font-heading text-4xl font-bold text-white">{price}</p>
                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">{copy}</p>
                <Button asChild className="mt-6 w-full" variant={name === "Premium" ? "default" : "secondary"}>
                  <Link href="/signup">Choose {name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
