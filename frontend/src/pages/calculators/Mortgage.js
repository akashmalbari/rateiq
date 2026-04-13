import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fmt = n => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
const fmtCur = n => `$${fmt(n)}`;

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

function calcMortgage({ price, down, rate, term, propTax, hoa, insurance }) {
  const loan = price - down;
  const r = rate / 100 / 12;
  const n = term * 12;
  const monthly = r > 0 ? loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loan / n;
  const monthlyExtras = (price * propTax / 100 / 12) + (hoa) + (price * insurance / 100 / 12);
  const totalMonthly = monthly + monthlyExtras;
  const totalInterest = monthly * n - loan;

  // Amortization (yearly)
  let balance = loan;
  const schedule = [];
  for (let y = 1; y <= Math.min(term, 30); y++) {
    let yearInterest = 0, yearPrincipal = 0;
    for (let m = 0; m < 12; m++) {
      const interest = balance * r;
      const principal = Math.min(monthly - interest, balance);
      yearInterest += interest;
      yearPrincipal += principal;
      balance = Math.max(0, balance - principal);
    }
    schedule.push({ year: y, "Principal": Math.round(yearPrincipal), "Interest": Math.round(yearInterest), "Balance": Math.round(balance) });
    if (balance <= 0) break;
  }

  return { monthly: Math.round(monthly), totalMonthly: Math.round(totalMonthly), totalInterest: Math.round(totalInterest), loan: Math.round(loan), schedule };
}

export default function Mortgage() {
  const [inputs, setInputs] = useState({ price: 500000, down: 100000, rate: 6.8, term: 30, propTax: 1.2, hoa: 0, insurance: 0.5 });
  const [result, setResult] = useState(null);
  const [showAmort, setShowAmort] = useState(false);

  useEffect(() => { document.title = "Mortgage Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcMortgage(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-blue-400 text-xs font-mono">Housing Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Mortgage Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Calculate your monthly payment, total interest, and view a full amortization schedule.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-slate-200 mb-5">Loan Details</h3>
              <div className="space-y-4">
                {[
                  { key: "price", label: "Home Price", prefix: "$" },
                  { key: "down", label: "Down Payment", prefix: "$" },
                  { key: "rate", label: "Interest Rate", suffix: "%" },
                  { key: "term", label: "Loan Term", suffix: "yr" },
                  { key: "propTax", label: "Property Tax", suffix: "%" },
                  { key: "hoa", label: "HOA (monthly)", prefix: "$" },
                  { key: "insurance", label: "Home Insurance", suffix: "%" },
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
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                {/* Monthly breakdown */}
                <div className="bg-gradient-to-br from-amber-500/8 to-amber-600/4 border border-amber-500/20 rounded-2xl p-6">
                  <p className="text-xs text-slate-500 font-mono mb-2">TOTAL MONTHLY PAYMENT</p>
                  <p className="font-mono font-bold text-5xl text-slate-100 mb-1" data-testid="total-monthly">{fmtCur(result.totalMonthly)}</p>
                  <p className="text-sm text-slate-400">Principal + Interest: <span className="text-slate-200 font-mono">{fmtCur(result.monthly)}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Loan Amount", value: fmtCur(result.loan) },
                    { label: "Total Interest Paid", value: fmtCur(result.totalInterest), color: "text-rose-400" },
                    { label: "Total Payments", value: fmtCur(result.monthly * inputs.term * 12) },
                    { label: "Down Payment", value: `${((inputs.down / inputs.price) * 100).toFixed(1)}%` },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Annual Principal vs Interest</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={result.schedule.slice(0, 15)} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                      <Bar dataKey="Principal" fill="#10b981" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Interest" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Amortization toggle */}
                <button onClick={() => setShowAmort(!showAmort)} data-testid="amort-toggle"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-slate-400 text-sm hover:bg-white/10 transition-colors">
                  {showAmort ? "Hide" : "Show"} Full Amortization Schedule
                </button>

                {showAmort && (
                  <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            {["Year", "Principal", "Interest", "Balance"].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-mono uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.schedule.map(row => (
                            <tr key={row.year} className="border-b border-white/3 hover:bg-white/2">
                              <td className="px-4 py-2.5 font-mono text-slate-400">{row.year}</td>
                              <td className="px-4 py-2.5 font-mono text-emerald-400">{fmtCur(row.Principal)}</td>
                              <td className="px-4 py-2.5 font-mono text-amber-400">{fmtCur(row.Interest)}</td>
                              <td className="px-4 py-2.5 font-mono text-slate-300">{fmtCur(row.Balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="bg-[#151A22]/50 border border-white/5 rounded-xl p-4">
              <p className="text-xs text-slate-600">These estimates assume a fixed-rate mortgage. Actual payments may vary based on lender fees and terms.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
