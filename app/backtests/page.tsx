import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { BacktestConsole } from "@/app/backtests/backtest-console";

export default function BacktestsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-10">
        <BacktestConsole />
      </main>
      <SiteFooter />
    </div>
  );
}
