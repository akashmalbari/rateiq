import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

function calcInvestVsDebt({ debtAmount, debtRate, payment, investReturn, months }) {
  const dr = debtRate / 100 / 12;
  const ir = investReturn / 100 / 12;

  // Strategy A: Pay off debt first, then invest
  let debtBal = debtAmount;
  let investA = 0;
  const dataA = [];

  for (let m = 1; m <= months; m++) {
    if (debtBal > 0) {
      const interest = debtBal * dr;
      const principal = Math.min(payment - interest, debtBal);
      if (principal > 0) debtBal -= principal;
      else debtBal = 0;
    } else {
      investA = (investA + payment) * (1 + ir);
    }
    dataA.push({ month: m, "Pay Debt First": Math.round(investA - Math.max(0, debtBal)) });
  }

  // Strategy B: Invest all extra while paying minimum
  const minPmt = Math.max(debtAmount * dr * 1.05, payment * 0.5);
  let debtBal2 = debtAmount;
  let investB = 0;

  for (let m = 1; m <= months; m++) {
    const interest = debtBal2 * dr;
    const principal = Math.min(minPmt - interest, debtBal2);
    if (principal > 0) debtBal2 -= principal;
    investB = (investB + (payment - Math.min(minPmt, payment))) * (1 + ir);
    const netWorth = investB - Math.max(0, debtBal2);
    dataA[m - 1]["Invest While In Debt"] = Math.round(netWorth);
  }

  const finalPayDebt = dataA[months - 1]["Pay Debt First"] || 0;
  const finalInvest = dataA[months - 1]["Invest While In Debt"] || 0;
  const payDebtWins = finalPayDebt > finalInvest;

  return { chartData: dataA, finalPayDebt, finalInvest, diff: Math.abs(finalPayDebt - finalInvest), payDebtWins };
}

export default function InvestVsDebt() {
  const [inputs, setInputs] = useState({ debtAmount: 20000, debtRate: 18, payment: 600, investReturn: 9, months: 60 });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Invest vs Pay Off Debt Calculator | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcInvestVsDebt(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-teal-400 text-xs font-mono">Wealth Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Invest vs Pay Off Debt</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Should you invest extra cash or pay down high-interest debt? Compare net worth under both strategies.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-semibold text-slate-200 mb-1">Your Scenario</h3>
              {[
                { key: "debtAmount", label: "Total Debt Balance", prefix: "$" },
                { key: "debtRate", label: "Debt Interest Rate", suffix: "%" },
                { key: "payment", label: "Monthly Payment Budget", prefix: "$" },
                { key: "investReturn", label: "Expected Investment Return", suffix: "%" },
                { key: "months", label: "Time Horizon", suffix: "mo" },
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
              <div className="p-4 bg-teal-500/5 border border-teal-500/15 rounded-xl">
                <p className="text-xs text-teal-400 font-medium mb-1">Key Insight</p>
                <p className="text-xs text-slate-500">If your debt rate exceeds expected investment return, paying debt is mathematically superior.</p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className={`border rounded-2xl p-6 ${result.payDebtWins ? "bg-emerald-500/5 border-emerald-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
                  <p className="text-xs text-slate-500 font-mono mb-2">RECOMMENDATION</p>
                  <p className={`font-heading font-bold text-xl ${result.payDebtWins ? "text-emerald-400" : "text-blue-400"}`} data-testid="recommendation">
                    {result.payDebtWins
                      ? `Pay off debt first — ${inputs.debtRate}% debt rate beats ${inputs.investReturn}% investment return`
                      : `Invest while paying debt — ${inputs.investReturn}% return exceeds ${inputs.debtRate}% debt cost`
                    }
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Net difference: <span className="font-mono text-slate-200">{fmtCur(result.diff)}</span> over {inputs.months} months
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Net Worth: Pay Debt First", value: fmtCur(result.finalPayDebt), color: "text-emerald-400" },
                    { label: "Net Worth: Invest While In Debt", value: fmtCur(result.finalInvest), color: "text-blue-400" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Net Worth Comparison Over Time</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Month", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                      <Line type="monotone" dataKey="Pay Debt First" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Invest While In Debt" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
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
