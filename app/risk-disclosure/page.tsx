import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell max-w-4xl py-16">
        <h1 className="font-heading text-4xl font-bold text-white">Risk Disclosure</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-400">
          <p>Figure My Money provides educational market research only. Nothing on this platform is financial advice, investment advice, tax advice, legal advice, or a solicitation to buy or sell securities.</p>
          <p>Options trading involves substantial risk and is not suitable for every investor. Losses can exceed the premium received for certain strategies, and assignment, liquidity, execution, and volatility risks can materially change outcomes.</p>
          <p>Probability of profit, confidence scores, backtests, market summaries, and historical win-rate estimates are model outputs. They can be wrong, incomplete, delayed, or based on assumptions that do not match live market conditions.</p>
          <p>You are responsible for evaluating each trade, sizing risk appropriately, and consulting qualified professionals before making financial decisions.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
