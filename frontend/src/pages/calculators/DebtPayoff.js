import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fmt = n => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
const fmtCur = n => `$${fmt(n)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2633]/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
      <p className="text-slate-400 text-xs font-mono mb-2">Month {label}</p>
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

function calcDebt({ principal, rate, minPayment, extraPayment }) {
  const r = rate / 100 / 12;
  const pmt = minPayment + extraPayment;

  let balance = principal;
  let totalInterest = 0;
  let months = 0;
  const chartData = [];

  while (balance > 0 && months < 600) {
    const interest = balance * r;
    const principalPaid = Math.min(pmt - interest, balance);
    if (principalPaid <= 0) break;
    balance = balance - principalPaid;
    totalInterest += interest;
    months++;
    if (months % 3 === 0 || months <= 6) {
      chartData.push({ month: months, "Remaining Balance": Math.round(balance) });
    }
  }

  // Min payment only
  let balMin = principal;
  let totalInterestMin = 0;
  let monthsMin = 0;
  while (balMin > 0 && monthsMin < 600) {
    const interest = balMin * r;
    const principalPaid = Math.min(minPayment - interest, balMin);
    if (principalPaid <= 0) break;
    balMin -= principalPaid;
    totalInterestMin += interest;
    monthsMin++;
  }

  const interestSaved = totalInterestMin - totalInterest;
  const monthsSaved = monthsMin - months;

  return {
    months, totalInterest: Math.round(totalInterest), totalPaid: Math.round(principal + totalInterest),
    monthsMin, totalInterestMin: Math.round(totalInterestMin),
    interestSaved: Math.round(interestSaved), monthsSaved,
    payoffDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    chartData
  };
}

export default function DebtPayoff() {
  const [inputs, setInputs] = useState({ principal: 15000, rate: 19.9, minPayment: 350, extraPayment: 150 });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Debt Payoff Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcDebt(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  const yrs = m => { const y = Math.floor(m / 12); const mo = m % 12; return y > 0 ? `${y}y ${mo}m` : `${mo}m`; };

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-rose-400 text-xs font-mono">Wealth Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Debt Payoff Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">See exactly when you'll be debt-free and how much interest you'll save with extra payments.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-semibold text-slate-200 mb-1">Debt Details</h3>
              {[
                { key: "principal", label: "Current Balance", prefix: "$" },
                { key: "rate", label: "Annual Interest Rate", suffix: "%" },
                { key: "minPayment", label: "Minimum Monthly Payment", prefix: "$" },
                { key: "extraPayment", label: "Extra Monthly Payment", prefix: "$" },
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

              <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <p className="text-xs text-amber-400 font-medium mb-1">Avalanche Method</p>
                <p className="text-xs text-slate-500">Target your highest interest rate debts first to minimize total interest paid.</p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                {/* Headline */}
                <div className="bg-gradient-to-br from-emerald-500/8 to-emerald-600/4 border border-emerald-500/20 rounded-2xl p-6">
                  <p className="text-xs text-slate-500 font-mono mb-2">DEBT-FREE DATE</p>
                  <p className="font-heading font-bold text-4xl text-emerald-400" data-testid="payoff-date">{result.payoffDate}</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Payoff in <span className="text-slate-200 font-mono">{yrs(result.months)}</span>
                    {result.monthsSaved > 0 && <span className="text-emerald-400"> (saving {yrs(result.monthsSaved)} vs minimum payments)</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Interest (With Extra)", value: fmtCur(result.totalInterest), color: "text-amber-400", testid: "total-interest" },
                    { label: "Interest Saved", value: fmtCur(result.interestSaved), color: "text-emerald-400" },
                    { label: "Total Paid", value: fmtCur(result.totalPaid) },
                    { label: "Months Without Extra", value: yrs(result.monthsMin) },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5" data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Balance Over Time</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Month", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Remaining Balance" stroke="#f43f5e" fill="url(#debtGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
