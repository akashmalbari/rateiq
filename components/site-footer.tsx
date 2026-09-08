import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { RiskDisclaimer } from "@/components/risk-disclaimer";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080B10]">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-lg font-bold text-white">Figure My Money</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Daily quantitative options research for NASDAQ-100, price-screened stocks, and administrator-selected tickers,
            built around probability, liquidity, and defined risk.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-slate-400">
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/track-record" className="hover:text-white">Track Record</Link>
          <Link href="/backtests" className="hover:text-white">Backtests</Link>
          <Link href="/calculators" className="hover:text-white">Calculators</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
        </div>
        <div className="grid gap-2 text-sm text-slate-400">
          <Link href="/risk-disclosure" className="hover:text-white">Risk disclosure</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/admin" className="mt-3 flex items-center gap-2 text-slate-500 hover:text-white">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Admin console
          </Link>
        </div>
      </div>
      <RiskDisclaimer compact />
    </footer>
  );
}
