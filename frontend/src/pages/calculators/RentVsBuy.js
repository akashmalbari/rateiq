import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";

const fmt = (n) => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
const fmtCur = (n) => `$${fmt(n)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2633]/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
      <p className="text-slate-400 text-xs font-mono mb-2">Year {label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-mono font-medium" style={{ color: p.color }}>{fmtCur(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function calcRentVsBuy(inputs) {
  const { rent, homePrice, downPct, rate, propTax, maintenance, rentIncrease, appreciation, investReturn, years } = inputs;
  const down = homePrice * (downPct / 100);
  const loan = homePrice - down;
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const mortgage = monthlyRate > 0
    ? loan * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : loan / n;

  let rentNW = 0, buyNW = 0;
  let currentRent = rent;
  let currentPropertyValue = homePrice;
  let outstandingLoan = loan;
  let investedRentSavings = down;
  let breakeven = 0;

  const chartData = [];

  for (let y = 1; y <= years; y++) {
    // Rent scenario
    const monthlyMortgageCosts = mortgage + (homePrice * propTax / 100 / 12) + (homePrice * maintenance / 100 / 12);
    const annualRentPaid = currentRent * 12;
    const rentSavings = Math.max(0, (monthlyMortgageCosts - currentRent) * 12);
    investedRentSavings = investedRentSavings * (1 + investReturn / 100) + rentSavings;
    rentNW = investedRentSavings;
    currentRent *= (1 + rentIncrease / 100);

    // Buy scenario
    currentPropertyValue *= (1 + appreciation / 100);
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let m = 0; m < 12; m++) {
      const interest = outstandingLoan * monthlyRate;
      const principal = mortgage - interest;
      yearInterest += interest;
      yearPrincipal += principal;
      outstandingLoan = Math.max(0, outstandingLoan - principal);
    }
    const equity = currentPropertyValue - outstandingLoan;
    const buyingCosts = y === 1 ? homePrice * 0.03 : 0;
    buyNW = equity - buyingCosts;

    if (buyNW > rentNW && breakeven === 0) breakeven = y;

    chartData.push({ year: y, "Rent Net Worth": Math.round(rentNW), "Buy Net Worth": Math.round(buyNW) });
  }

  return { rentNW: Math.round(rentNW), buyNW: Math.round(buyNW), diff: Math.round(buyNW - rentNW), breakeven, chartData, mortgage: Math.round(mortgage) };
}

export default function RentVsBuy() {
  const [inputs, setInputs] = useState({
    rent: 2500, homePrice: 500000, downPct: 20, rate: 6.8, propTax: 1.2,
    maintenance: 1.0, rentIncrease: 3, appreciation: 4, investReturn: 8, years: 10
  });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Rent vs Buy Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcRentVsBuy(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const buyWins = result?.buyNW > result?.rentNW;

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-amber-500 text-xs font-mono">Housing Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Rent vs Buy Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Compare long-term net worth of renting versus buying. Includes taxes, appreciation, and investment returns.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-slate-200 mb-5">Scenario Inputs</h3>
              <div className="space-y-4">
                {[
                  { key: "rent", label: "Monthly Rent", prefix: "$" },
                  { key: "homePrice", label: "Home Price", prefix: "$" },
                  { key: "downPct", label: "Down Payment", suffix: "%" },
                  { key: "rate", label: "Mortgage Rate", suffix: "%" },
                  { key: "propTax", label: "Property Tax", suffix: "%" },
                  { key: "maintenance", label: "Annual Maintenance", suffix: "%" },
                  { key: "rentIncrease", label: "Annual Rent Increase", suffix: "%" },
                  { key: "appreciation", label: "Home Appreciation", suffix: "%" },
                  { key: "investReturn", label: "Investment Return", suffix: "%" },
                  { key: "years", label: "Time Horizon (Years)", suffix: "yr" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono">{f.label}</label>
                    <div className="relative">
                      {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.prefix}</span>}
                      <input type="number" value={inputs[f.key]}
                        onChange={e => set(f.key, e.target.value)}
                        data-testid={`input-${f.key}`}
                        className={`w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 text-slate-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all font-mono ${f.prefix ? "pl-8 pr-3" : "px-3"}`}
                      />
                      {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.suffix}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                {/* Recommendation */}
                <div className={`border rounded-2xl p-6 ${buyWins ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                  <p className="text-xs font-mono text-slate-500 mb-2">RECOMMENDATION</p>
                  <p className={`font-heading font-bold text-xl ${buyWins ? "text-emerald-400" : "text-amber-400"}`} data-testid="recommendation">
                    {buyWins ? `Buying is stronger over ${inputs.years} years` : `Renting is stronger over ${inputs.years} years`}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Net difference: <span className="font-mono text-slate-200">{fmtCur(Math.abs(result.diff))}</span>
                    {result.breakeven > 0 && ` · Break-even at year ${result.breakeven}`}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Monthly Mortgage", value: fmtCur(result.mortgage), sub: "Principal + Interest" },
                    { label: "Down Payment", value: fmtCur(inputs.homePrice * inputs.downPct / 100) },
                    { label: "Rent Net Worth", value: fmtCur(result.rentNW), color: "text-blue-400", testid: "rent-nw" },
                    { label: "Buy Net Worth", value: fmtCur(result.buyNW), color: "text-emerald-400", testid: "buy-nw" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5" data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                      {s.sub && <p className="text-xs text-slate-600 mt-1">{s.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Net Worth Over Time</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="buyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Year", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px", color: "#94a3b8" }} />
                      <Area type="monotone" dataKey="Rent Net Worth" stroke="#3b82f6" fill="url(#rentGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="Buy Net Worth" stroke="#10b981" fill="url(#buyGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Methodology */}
            <div className="bg-[#151A22]/50 border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-slate-600 font-mono mb-3">METHODOLOGY</p>
              <div className="space-y-2 text-sm text-slate-400 leading-relaxed">
                <p>
                  This comparison models two scenarios over your selected time horizon: (1) renting and investing savings,
                  and (2) buying, building equity, and applying home appreciation assumptions.
                </p>
                <p>
                  Key assumptions such as appreciation, rent growth, property tax, and investment return can materially change results.
                  Treat outputs as scenario estimates, not guarantees.
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-[#151A22]/40 border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-slate-600 font-mono mb-3">FAQ</p>
              <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                <div>
                  <p className="text-slate-200 font-medium mb-1">What does break-even year mean?</p>
                  <p>It is the first year in which the modeled buy scenario net worth exceeds the modeled rent scenario net worth.</p>
                </div>
                <div>
                  <p className="text-slate-200 font-medium mb-1">Should I decide only from this calculator?</p>
                  <p>No. You should also consider mobility needs, local market risk, maintenance uncertainty, and personal cash-flow stability.</p>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-[#151A22]/50 border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-slate-600 font-mono mb-3">NEXT STEPS</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/calculators/mortgage" className="flex items-center gap-1.5 text-amber-500 text-sm hover:text-amber-400 transition-colors">
                  Refine with Mortgage Calculator <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/blog/rent-vs-buy-2026" className="flex items-center gap-1.5 text-amber-500 text-sm hover:text-amber-400 transition-colors">
                  Read Rent vs Buy Guide <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-slate-600 mt-2">For educational use only. Not financial advice.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
