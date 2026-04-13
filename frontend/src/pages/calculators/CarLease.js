import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";

const fmt = n => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
const fmtCur = n => `$${fmt(n)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2633]/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
      <p className="text-slate-400 text-xs font-mono mb-2">{label}</p>
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

function calcCarLease({ price, down, loanRate, loanTerm, leasePmt, leaseTerm, maintenance, depreciationRate, years }) {
  // Buy costs
  const loan = price - down;
  const r = loanRate / 100 / 12;
  const n = loanTerm;
  const monthlyLoan = r > 0 ? loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loan / n;
  const totalLoanPaid = down + monthlyLoan * loanTerm;
  const totalMaintBuy = maintenance * years;
  const residualValue = price * Math.pow(1 - depreciationRate / 100, years);
  const totalBuyCost = totalLoanPaid + totalMaintBuy - residualValue;

  // Lease costs
  const numLeases = Math.ceil((years * 12) / leaseTerm);
  const totalLeaseCost = leasePmt * years * 12;

  // Yearly chart data
  const chartData = [];
  let cumulBuy = down;
  let cumulLease = 0;
  for (let y = 1; y <= years; y++) {
    const yearLoan = y <= Math.ceil(loanTerm / 12) ? monthlyLoan * 12 : 0;
    cumulBuy += yearLoan + maintenance - (y === years ? residualValue : 0);
    cumulLease += leasePmt * 12;
    chartData.push({ year: `Yr ${y}`, "Buy (Cumulative)": Math.round(cumulBuy), "Lease (Cumulative)": Math.round(cumulLease) });
  }

  return {
    monthlyLoan: Math.round(monthlyLoan),
    totalBuyCost: Math.round(totalBuyCost),
    totalLeaseCost: Math.round(totalLeaseCost),
    residualValue: Math.round(residualValue),
    diff: Math.round(totalLeaseCost - totalBuyCost),
    buyWins: totalBuyCost < totalLeaseCost,
    chartData
  };
}

export default function CarLease() {
  const [inputs, setInputs] = useState({
    price: 45000, down: 5000, loanRate: 7.5, loanTerm: 60, leasePmt: 550,
    leaseTerm: 36, maintenance: 1200, depreciationRate: 15, years: 5
  });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Car Lease vs Buy Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcCarLease(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-purple-400 text-xs font-mono">Lifestyle Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Car Lease vs Buy</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Compare total cost of leasing versus financing. Includes depreciation, maintenance, and residual value.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-semibold text-slate-200 mb-1">Vehicle Details</h3>
              {[
                { key: "price", label: "Car Price", prefix: "$" },
                { key: "down", label: "Down Payment", prefix: "$" },
                { key: "loanRate", label: "Auto Loan Rate", suffix: "%" },
                { key: "loanTerm", label: "Loan Term", suffix: "mo" },
                { key: "leasePmt", label: "Monthly Lease Payment", prefix: "$" },
                { key: "leaseTerm", label: "Lease Term", suffix: "mo" },
                { key: "maintenance", label: "Annual Maintenance", prefix: "$" },
                { key: "depreciationRate", label: "Annual Depreciation", suffix: "%" },
                { key: "years", label: "Comparison Period", suffix: "yr" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono">{f.label}</label>
                  <div className="relative">
                    {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.prefix}</span>}
                    <input type="number" value={inputs[f.key]} onChange={e => set(f.key, e.target.value)}
                      data-testid={`input-${f.key}`}
                      className={`w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all font-mono ${f.prefix ? "pl-8 pr-3" : "px-3"}`}
                    />
                    {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className={`border rounded-2xl p-6 ${result.buyWins ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                  <p className="text-xs text-slate-500 font-mono mb-2">RECOMMENDATION</p>
                  <p className={`font-heading font-bold text-xl ${result.buyWins ? "text-emerald-400" : "text-amber-400"}`} data-testid="recommendation">
                    {result.buyWins ? "Buying costs less over this period" : "Leasing costs less over this period"}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    You save <span className="font-mono text-slate-200">{fmtCur(Math.abs(result.diff))}</span> by {result.buyWins ? "buying" : "leasing"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Monthly Loan Payment", value: fmtCur(result.monthlyLoan) },
                    { label: "Monthly Lease Payment", value: fmtCur(inputs.leasePmt) },
                    { label: "Total Buy Cost", value: fmtCur(result.totalBuyCost), color: "text-blue-400", testid: "total-buy" },
                    { label: "Total Lease Cost", value: fmtCur(result.totalLeaseCost), color: "text-amber-400", testid: "total-lease" },
                    { label: "Residual Value", value: fmtCur(result.residualValue), color: "text-emerald-400" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5" data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Cumulative Cost Comparison</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                      <Bar dataKey="Buy (Cumulative)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Lease (Cumulative)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-[#151A22]/50 border border-white/5 rounded-xl p-4">
                  <div className="flex flex-wrap gap-3">
                    <a href="https://www.bankofamerica.com/auto-loans/auto-loan-rates/?utm_source=figuremymoney" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-amber-500 text-sm hover:text-amber-400">
                      Compare Auto Loan Rates <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <a href="https://www.caranddriver.com/news/a29127517/best-lease-deals/?utm_source=figuremymoney" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-amber-500 text-sm hover:text-amber-400">
                      Browse Lease Deals <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">This site may earn a commission from partner links.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
