import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ComparisonBar } from "../../components/ComparisonBar";
import { FAQSection } from "../../components/FAQSection";

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

function calc({ cash, investments, propertyValue, loans, creditCardDebt }) {
  const assets = cash + investments + propertyValue;
  const liabilities = loans + creditCardDebt;
  const netWorth = assets - liabilities;
  const debtLoad = assets > 0 ? (liabilities / assets) * 100 : 0;
  const propertyConcentration = assets > 0 ? (propertyValue / assets) * 100 : 0;
  const chartData = [
    { name: "Balance Sheet", Assets: assets, Liabilities: liabilities },
  ];
  return { assets, liabilities, netWorth, debtLoad, propertyConcentration, chartData };
}

const FAQS = [
  { question: "Is home equity part of net worth?", answer: "Yes. Property value is an asset, and any associated debt belongs under liabilities. Enter the gross property value in assets and your mortgage balance under loans." },
  { question: "Why can net worth be negative?", answer: "A negative net worth means your debts are larger than your assets right now. This is common for students, recent graduates, or anyone early in a debt payoff journey." },
  { question: "How often should I calculate net worth?", answer: "Monthly or quarterly is usually enough. Consistency matters more than frequency because trends tell you more than one isolated number." },
  { question: "Should I include retirement accounts as investments?", answer: "Yes. If you want a fuller picture, retirement balances fit naturally in the investments field because they are still assets you own." },
];

export default function NetWorth() {
  const [inputs, setInputs] = useState({ cash: 18000, investments: 72000, propertyValue: 320000, loans: 110000, creditCardDebt: 4500 });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Net Worth Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calc(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const maxBar = result ? Math.max(result.assets, result.liabilities, inputs.propertyValue) : 1;

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-violet-400 text-xs font-mono">Balance Sheet</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Net Worth Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Measure what you own against what you owe. Get your complete financial position in a single snapshot.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-slate-200 mb-2">Assets</h3>
              <p className="text-xs text-slate-500 font-mono mb-5">What you OWN</p>
              <div className="space-y-4 mb-7">
                {[
                  { key: "cash", label: "Cash & Savings", prefix: "$" },
                  { key: "investments", label: "Investments & Retirement", prefix: "$" },
                  { key: "propertyValue", label: "Property Value", prefix: "$" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono">{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.prefix}</span>
                      <input type="number" value={inputs[f.key]} onChange={e => set(f.key, e.target.value)}
                        data-testid={`input-${f.key}`}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all font-mono" />
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="font-heading font-semibold text-slate-200 mb-2">Liabilities</h3>
              <p className="text-xs text-slate-500 font-mono mb-5">What you OWE</p>
              <div className="space-y-4">
                {[
                  { key: "loans", label: "Loans (Mortgage, Student, Auto)", prefix: "$" },
                  { key: "creditCardDebt", label: "Credit Card Debt", prefix: "$" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono">{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.prefix}</span>
                      <input type="number" value={inputs[f.key]} onChange={e => set(f.key, e.target.value)}
                        data-testid={`input-${f.key}`}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className={`border rounded-2xl p-6 ${result.netWorth >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
                  <p className="text-xs text-slate-500 font-mono mb-2">NET WORTH</p>
                  <p className={`font-mono font-bold text-5xl ${result.netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`} data-testid="net-worth-value">
                    {result.netWorth < 0 ? "-" : ""}{fmtCur(Math.abs(result.netWorth))}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    {result.netWorth >= 0
                      ? `Assets exceed liabilities by ${fmtCur(result.netWorth)}`
                      : `Liabilities exceed assets by ${fmtCur(Math.abs(result.netWorth))}`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Assets", value: fmtCur(result.assets), color: "text-emerald-400", testid: "total-assets" },
                    { label: "Total Liabilities", value: fmtCur(result.liabilities), color: "text-rose-400", testid: "total-liabilities" },
                    { label: "Debt Load", value: `${result.debtLoad.toFixed(1)}%`, testid: "debt-load" },
                    { label: "Property Concentration", value: `${result.propertyConcentration.toFixed(0)}%` },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5" data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="font-heading font-semibold text-slate-200 mb-2">Balance Sheet Breakdown</h4>
                  <ComparisonBar label="Total Assets" value={result.assets} valueLabel={fmtCur(result.assets)} max={maxBar} color="#10b981" />
                  <ComparisonBar label="Total Liabilities" value={result.liabilities} valueLabel={fmtCur(result.liabilities)} max={maxBar} color="#f87171" />
                  <ComparisonBar label="Property (within assets)" value={inputs.propertyValue} valueLabel={fmtCur(inputs.propertyValue)} max={maxBar} color="#f59e0b" />
                  <ComparisonBar label="Investments (within assets)" value={inputs.investments} valueLabel={fmtCur(inputs.investments)} max={maxBar} color="#6366f1" />
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Assets vs Liabilities</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                      <Bar dataKey="Assets" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Liabilities" fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <FAQSection faqs={FAQS} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
