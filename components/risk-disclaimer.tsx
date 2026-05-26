import { ShieldAlert } from "lucide-react";

export function RiskDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="border-t border-white/10 bg-[#080B10]/80">
      <div className="container-shell flex flex-col gap-3 py-5 text-xs leading-relaxed text-slate-500 md:flex-row md:items-start">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
        <p>
          Figure My Money is for education and research only. It is not investment,
          tax, legal, or financial advice. Options involve substantial risk and are
          not suitable for every investor. Probability estimates, backtests, and
          historical outcomes do not guarantee profitability. You are responsible
          for your own due diligence and trade decisions.
        </p>
        {!compact ? (
          <p className="md:max-w-xs">
            No recommendation is personalized to your portfolio, risk tolerance, or
            financial condition.
          </p>
        ) : null}
      </div>
    </div>
  );
}
