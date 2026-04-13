import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";

const fmt = n => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
const fmtCur = n => `$${fmt(n)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2633]/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
      <p className="text-slate-400 text-xs font-mono mb-2">Age {label}</p>
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

function calcRetirement({ currentSavings, monthlyContrib, annualReturn, currentAge, retirementAge, inflation }) {
  const r = annualReturn / 100;
  const infl = inflation / 100;
  const rMonthly = r / 12;
  const months = (retirementAge - currentAge) * 12;
  const years = retirementAge - currentAge;

  if (years <= 0) return null;

  // FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r * (1+r)
  const fv = currentSavings * Math.pow(1 + r, years) +
    monthlyContrib * (Math.pow(1 + rMonthly, months) - 1) / rMonthly * (1 + rMonthly);

  const monthlyIncome = fv * 0.04 / 12;

  // Chart data (by age)
  const chartData = [];
  for (let age = currentAge; age <= retirementAge; age++) {
    const y = age - currentAge;
    const val = currentSavings * Math.pow(1 + r, y) +
      monthlyContrib * (Math.pow(1 + rMonthly, y * 12) - 1) / rMonthly * (1 + rMonthly);
    chartData.push({ age, "Portfolio Value": Math.round(val) });
  }

  // Inflation-adjusted
  const fvReal = fv / Math.pow(1 + infl, years);
  const monthlyIncomeReal = fvReal * 0.04 / 12;

  return {
    fv: Math.round(fv), fvReal: Math.round(fvReal),
    monthlyIncome: Math.round(monthlyIncome), monthlyIncomeReal: Math.round(monthlyIncomeReal),
    years, totalContribs: Math.round(currentSavings + monthlyContrib * months),
    chartData
  };
}

export default function Retirement() {
  const [inputs, setInputs] = useState({ currentSavings: 50000, monthlyContrib: 500, annualReturn: 8, currentAge: 35, retirementAge: 65, inflation: 3 });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Retirement Projection Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcRetirement(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-emerald-400 text-xs font-mono">Wealth Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Retirement Projection</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Project your retirement portfolio value and estimated monthly income using the 4% withdrawal rule.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-2">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-semibold text-slate-200 mb-1">Your Numbers</h3>
              {[
                { key: "currentSavings", label: "Current Savings", prefix: "$" },
                { key: "monthlyContrib", label: "Monthly Contribution", prefix: "$" },
                { key: "annualReturn", label: "Expected Annual Return", suffix: "%" },
                { key: "currentAge", label: "Current Age", suffix: "yr" },
                { key: "retirementAge", label: "Retirement Age", suffix: "yr" },
                { key: "inflation", label: "Inflation Rate", suffix: "%" },
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
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <p className="text-xs text-amber-400 font-medium mb-1">4% Withdrawal Rule</p>
                <p className="text-xs text-slate-500">Monthly income = Portfolio × 4% ÷ 12. Historically sustains 30+ year retirements.</p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className="bg-gradient-to-br from-emerald-500/8 to-emerald-600/4 border border-emerald-500/20 rounded-2xl p-6">
                  <p className="text-xs text-slate-500 font-mono mb-2">PROJECTED PORTFOLIO AT RETIREMENT</p>
                  <p className="font-mono font-bold text-5xl text-emerald-400" data-testid="future-value">{fmtCur(result.fv)}</p>
                  <p className="text-sm text-slate-400 mt-2">
                    In today's dollars: <span className="text-slate-200 font-mono">{fmtCur(result.fvReal)}</span>
                    <span className="text-slate-500"> (inflation-adjusted)</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Monthly Income (4% Rule)", value: fmtCur(result.monthlyIncome), color: "text-emerald-400", testid: "monthly-income" },
                    { label: "Monthly Income (Inflation-Adj)", value: fmtCur(result.monthlyIncomeReal), color: "text-blue-400" },
                    { label: "Years to Retirement", value: result.years },
                    { label: "Total Contributions", value: fmtCur(result.totalContribs) },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5" data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Portfolio Growth by Age</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="age" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Age", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : (v / 1000).toFixed(0) + "k"}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Portfolio Value" stroke="#10b981" fill="url(#retGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-[#151A22]/50 border border-white/5 rounded-xl p-4">
                  <a href="https://fidelity.app.link/OVhFkh7q71b/?utm_source=figuremymoney" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-amber-500 text-sm hover:text-amber-400">
                    Open a Retirement Account at Fidelity <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-xs text-slate-600 mt-1">This site may earn a commission from partner links.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
