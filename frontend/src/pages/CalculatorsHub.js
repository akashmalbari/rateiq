import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Home, Car, BarChart2, DollarSign, PiggyBank, TrendingUp, Calculator, MapPin, Activity, Shield, Landmark } from "lucide-react";

const CALCULATORS = [
  {
    title: "Rent vs Buy",
    desc: "Compare long-term net worth of renting versus owning a home with appreciation, taxes, and investment returns.",
    link: "/calculators/rent-vs-buy", category: "Housing", icon: Home, color: "amber", tag: "Most Popular",
  },
  {
    title: "Mortgage Calculator",
    desc: "Calculate monthly payments, total interest, and view a full year-by-year amortization schedule.",
    link: "/calculators/mortgage", category: "Housing", icon: Calculator, color: "blue", tag: "",
  },
  {
    title: "Buy vs Invest",
    desc: "Should your down payment go into a home or the stock market? Full 30-year side-by-side wealth comparison.",
    link: "/calculators/buy-vs-invest", category: "Housing", icon: Landmark, color: "indigo", tag: "New",
  },
  {
    title: "Car Lease vs Buy",
    desc: "Compare total cost of leasing versus financing. Includes depreciation, maintenance, and ownership value.",
    link: "/calculators/car-lease", category: "Lifestyle", icon: Car, color: "purple", tag: "",
  },
  {
    title: "Cost of Living",
    desc: "Compare 11 major US cities. See exactly what salary you'd need in your target city to maintain your lifestyle.",
    link: "/calculators/cost-of-living", category: "Lifestyle", icon: MapPin, color: "sky", tag: "New",
  },
  {
    title: "Debt Payoff Calculator",
    desc: "See exactly when you'll be debt-free and how much interest you'll save with the avalanche or snowball method.",
    link: "/calculators/debt-payoff", category: "Wealth", icon: DollarSign, color: "rose", tag: "",
  },
  {
    title: "Retirement Projection",
    desc: "Project your retirement portfolio and monthly income based on savings, contributions, and expected returns.",
    link: "/calculators/retirement", category: "Wealth", icon: PiggyBank, color: "emerald", tag: "Top Rated",
  },
  {
    title: "Invest vs Pay Off Debt",
    desc: "Should you invest extra cash or pay down debt? Compare expected returns against guaranteed interest savings.",
    link: "/calculators/invest-vs-debt", category: "Wealth", icon: BarChart2, color: "teal", tag: "",
  },
  {
    title: "Net Worth Calculator",
    desc: "Your complete financial balance sheet — total assets minus total liabilities in one clear snapshot.",
    link: "/calculators/net-worth", category: "Wealth", icon: Activity, color: "violet", tag: "New",
  },
  {
    title: "Emergency Fund",
    desc: "Calculate your ideal 3, 6, or 12-month cash reserve target based on your income risk level.",
    link: "/calculators/emergency-fund", category: "Wealth", icon: Shield, color: "cyan", tag: "New",
  },
  {
    title: "Stock Returns Calculator",
    desc: "Model portfolio growth with compound interest, regular contributions, and time horizon projections.",
    link: "/calculators/stock-returns", category: "Wealth", icon: TrendingUp, color: "green", tag: "",
  },
];

const ACCENT_COLORS = {
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-500",
  rose: "bg-rose-500/10 border-rose-500/20 text-rose-500",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  teal: "bg-teal-500/10 border-teal-500/20 text-teal-500",
  indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-500",
  sky: "bg-sky-500/10 border-sky-500/20 text-sky-500",
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-500",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
  green: "bg-green-500/10 border-green-500/20 text-green-500",
};

function CalcCard({ calc }) {
  const Icon = calc.icon;
  const colorClass = ACCENT_COLORS[calc.color];
  return (
    <Link to={calc.link} data-testid={`calc-${calc.link.split("/").pop()}`}
      className="group bg-[#151A22]/80 border border-white/5 rounded-2xl p-7 hover:border-amber-500/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 flex flex-col">
      <div className="flex items-start justify-between mb-5">
        <div className={`w-11 h-11 rounded-xl border ${colorClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {calc.tag && (
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${calc.tag === "New" ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-500"}`}>{calc.tag}</span>
        )}
      </div>
      <div className="mb-1">
        <span className={`text-xs font-mono font-medium ${colorClass.split(" ").pop()}`}>{calc.category}</span>
      </div>
      <h3 className="font-heading font-semibold text-xl text-slate-100 mb-2 group-hover:text-amber-400 transition-colors">{calc.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed flex-1">{calc.desc}</p>
      <div className="mt-5 flex items-center gap-1.5 text-amber-500 text-sm font-medium">
        Open calculator <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

export default function CalculatorsHub() {
  useEffect(() => { document.title = "All Financial Calculators | FigureMyMoney"; }, []);
  return (
    <div className="bg-[#0B0E14] min-h-screen">
      {/* Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
            <Calculator className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-500 text-xs font-medium font-mono">11 Free Calculators</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-100 mb-5" data-testid="hub-title">
            Finance Decision Engine
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            All calculators in one place. Pick any tool below to start comparing financial scenarios with real data.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CALCULATORS.map(c => <CalcCard key={c.link} calc={c} />)}
        </div>

        {/* Disclaimer */}
        <div className="mt-16 bg-[#151A22]/50 border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            <strong className="text-slate-400">Not financial advice.</strong> These calculators provide estimates for informational purposes only.
            Individual results will vary. Consult a licensed financial advisor for personalized guidance.
          </p>
        </div>
      </section>
    </div>
  );
}
