import { useState, useEffect } from "react";
import { ComparisonBar } from "../../components/ComparisonBar";
import { FAQSection } from "../../components/FAQSection";

const fmt = n => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
const fmtCur = n => `$${fmt(n)}`;

const RESERVE_OPTIONS = [
  { value: 3, label: "Lower risk (3 months)" },
  { value: 6, label: "Balanced (6 months)" },
  { value: 12, label: "High cushion (12 months)" },
];

function calc({ monthlyExpenses, riskLevel }) {
  const months = parseInt(riskLevel, 10) || 6;
  const target = monthlyExpenses * months;
  const threeMonth = monthlyExpenses * 3;
  const sixMonth = monthlyExpenses * 6;
  const twelveMonth = monthlyExpenses * 12;
  return { target, threeMonth, sixMonth, twelveMonth, months };
}

const FAQS = [
  { question: "What expenses should I include?", answer: "Use essential monthly expenses: housing, food, insurance, debt minimums, utilities, and transportation. Optional spending can be layered in if you want a larger buffer." },
  { question: "When should I choose 12 months?", answer: "A 12-month reserve often makes sense if your income is volatile, you are self-employed, or your household would have a hard time replacing lost income quickly." },
  { question: "Should my emergency fund stay in cash?", answer: "Usually yes. The goal is accessibility and stability, not long-term growth. High-yield savings accounts are a common home for emergency funds." },
  { question: "Can I build the fund in stages?", answer: "Yes. Many people target one month first, then three, then six. Hitting milestones tends to feel more realistic than chasing the full amount at once." },
];

export default function EmergencyFund() {
  const [inputs, setInputs] = useState({ monthlyExpenses: 4200, riskLevel: 6 });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Emergency Fund Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calc(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: k === "riskLevel" ? parseInt(v, 10) : parseFloat(v) || 0 }));
  const maxBar = result ? result.twelveMonth : 1;

  const reserveLabel = inputs.riskLevel === 3 ? "lean" : inputs.riskLevel === 6 ? "balanced" : "deep";
  const accentColor = inputs.riskLevel === 3 ? "#f59e0b" : inputs.riskLevel === 6 ? "#10b981" : "#6366f1";

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-cyan-400 text-xs font-mono">Cash Reserve</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Emergency Fund Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Calculate your ideal emergency fund target — 3, 6, or 12 months of expenses — based on your income risk level.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-slate-200 mb-5">Your Situation</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono">Monthly Essential Expenses</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input type="number" value={inputs.monthlyExpenses} onChange={e => set("monthlyExpenses", e.target.value)}
                      data-testid="input-monthlyExpenses"
                      className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-3 font-mono">Reserve Target</label>
                  <div className="space-y-2">
                    {RESERVE_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => set("riskLevel", opt.value)}
                        data-testid={`reserve-${opt.value}`}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${inputs.riskLevel === opt.value
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-[#0B0E14] border-white/10 text-slate-400 hover:border-white/20"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                  <p className="text-xs text-cyan-400 font-medium mb-1">Why It Matters</p>
                  <p className="text-xs text-slate-500">An emergency fund buys time. It prevents debt spiral and forced asset sales when unexpected expenses hit.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className="bg-gradient-to-br from-cyan-500/8 to-cyan-600/4 border border-cyan-500/20 rounded-2xl p-6">
                  <p className="text-xs text-slate-500 font-mono mb-2">RECOMMENDED EMERGENCY FUND ({inputs.riskLevel} MONTHS)</p>
                  <p className="font-mono font-bold text-5xl text-cyan-400" data-testid="emergency-fund-target">{fmtCur(result.target)}</p>
                  <p className="text-sm text-slate-400 mt-2">
                    A <span className="text-slate-200">{reserveLabel}</span> reserve — {inputs.riskLevel} months of {fmtCur(inputs.monthlyExpenses)}/mo in expenses
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "3-Month Reserve", value: fmtCur(result.threeMonth), active: inputs.riskLevel === 3, testid: "three-month" },
                    { label: "6-Month Reserve", value: fmtCur(result.sixMonth), active: inputs.riskLevel === 6, testid: "six-month" },
                    { label: "12-Month Reserve", value: fmtCur(result.twelveMonth), active: inputs.riskLevel === 12, testid: "twelve-month" },
                  ].map((s, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${s.active ? "bg-amber-500/5 border-amber-500/20" : "bg-[#151A22]/80 border-white/5"}`} data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-lg ${s.active ? "text-amber-400" : "text-slate-300"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="font-heading font-semibold text-slate-200 mb-2">Reserve Options Compared</h4>
                  <ComparisonBar label="3-Month (Lean)" value={result.threeMonth} valueLabel={fmtCur(result.threeMonth)} max={maxBar} color={inputs.riskLevel === 3 ? accentColor : "#475569"} />
                  <ComparisonBar label="6-Month (Balanced)" value={result.sixMonth} valueLabel={fmtCur(result.sixMonth)} max={maxBar} color={inputs.riskLevel === 6 ? accentColor : "#475569"} />
                  <ComparisonBar label="12-Month (Deep)" value={result.twelveMonth} valueLabel={fmtCur(result.twelveMonth)} max={maxBar} color={inputs.riskLevel === 12 ? accentColor : "#475569"} />
                </div>

                <div className="bg-[#151A22]/50 border border-white/5 rounded-xl p-5">
                  <p className="text-xs text-slate-500 font-mono mb-2">BUILDING YOUR FUND</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">Save $500/month</p>
                      <p className="font-mono text-slate-200">Reach goal in <span className="text-amber-400">{Math.ceil(result.target / 500)} months</span></p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Save $1,000/month</p>
                      <p className="font-mono text-slate-200">Reach goal in <span className="text-amber-400">{Math.ceil(result.target / 1000)} months</span></p>
                    </div>
                  </div>
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
