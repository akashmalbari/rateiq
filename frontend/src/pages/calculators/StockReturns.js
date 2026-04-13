import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

function calcStock({ initial, monthly, annualReturn, years, stockPct }) {
  const r = annualReturn / 100 / 12;
  const bondReturn = 0.04 / 12;
  const blendedR = (stockPct / 100) * r + ((100 - stockPct) / 100) * bondReturn;

  const chartData = [];
  let portfolio = initial;

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      portfolio = (portfolio + monthly) * (1 + blendedR);
    }
    const withoutContribs = initial * Math.pow(1 + annualReturn / 100, y);
    chartData.push({
      year: y,
      "With Contributions": Math.round(portfolio),
      "Initial Only (No Additions)": Math.round(withoutContribs),
    });
  }

  const totalContribs = initial + monthly * years * 12;
  const gain = portfolio - totalContribs;

  return {
    finalValue: Math.round(portfolio),
    totalContribs: Math.round(totalContribs),
    totalGain: Math.round(gain),
    gainPct: ((gain / totalContribs) * 100).toFixed(1),
    annualizedReturn: annualReturn * (stockPct / 100) + 4 * ((100 - stockPct) / 100),
    chartData
  };
}

export default function StockReturns() {
  const [inputs, setInputs] = useState({ initial: 10000, monthly: 500, annualReturn: 10, years: 20, stockPct: 80 });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Stock Returns Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcStock(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-indigo-400 text-xs font-mono">Wealth Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Stock Returns Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Model investment portfolio growth with compound interest, regular contributions, and asset allocation.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-semibold text-slate-200 mb-1">Portfolio Settings</h3>
              {[
                { key: "initial", label: "Initial Investment", prefix: "$" },
                { key: "monthly", label: "Monthly Contribution", prefix: "$" },
                { key: "annualReturn", label: "Expected Annual Return (Stocks)", suffix: "%" },
                { key: "years", label: "Investment Period", suffix: "yr" },
                { key: "stockPct", label: "Stock Allocation", suffix: "%" },
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

              {/* Asset allocation visual */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Stocks: {inputs.stockPct}%</span>
                  <span>Bonds: {100 - inputs.stockPct}%</span>
                </div>
                <div className="h-2 bg-[#0B0E14] border border-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all" style={{ width: `${inputs.stockPct}%` }} />
                </div>
              </div>

              <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                <p className="text-xs text-indigo-400 font-medium mb-1">Historical Context</p>
                <p className="text-xs text-slate-500">S&P 500 avg annual return: ~10% (1957–2025). Past performance doesn't guarantee future results.</p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className="bg-gradient-to-br from-indigo-500/8 to-indigo-600/4 border border-indigo-500/20 rounded-2xl p-6">
                  <p className="text-xs text-slate-500 font-mono mb-2">PORTFOLIO VALUE IN {inputs.years} YEARS</p>
                  <p className="font-mono font-bold text-5xl text-slate-100" data-testid="final-value">{fmtCur(result.finalValue)}</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Total gain: <span className="text-emerald-400 font-mono">{fmtCur(result.totalGain)}</span>
                    <span className="text-slate-500"> (+{result.gainPct}%)</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Invested", value: fmtCur(result.totalContribs) },
                    { label: "Investment Gains", value: fmtCur(result.totalGain), color: "text-emerald-400" },
                    { label: "Blended Annual Return", value: `~${result.annualizedReturn.toFixed(1)}%` },
                    { label: "Monthly Contribution", value: fmtCur(inputs.monthly) },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Portfolio Growth Over Time</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="noContrib" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Year", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : (v / 1000).toFixed(0) + "k"}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="With Contributions" stroke="#6366f1" fill="url(#stockGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="Initial Only (No Additions)" stroke="#f59e0b" fill="url(#noContrib)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-[#151A22]/50 border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-600">
                    Assumes constant annual return. Markets are volatile — actual returns will vary. Bonds modeled at 4% annual return.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
