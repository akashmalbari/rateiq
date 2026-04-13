import { useState, useEffect } from "react";
import { ComparisonBar } from "../../components/ComparisonBar";
import { FAQSection } from "../../components/FAQSection";

const fmt = n => n?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0";
const fmtCur = n => `$${fmt(n)}`;
const fmtPct = (v, showSign = true) => {
  const sign = showSign && v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
};

const CITY_INDEXES = {
  "Austin, TX": 119, "Boston, MA": 162, "Charlotte, NC": 104,
  "Chicago, IL": 108, "Dallas, TX": 107, "Denver, CO": 129,
  "Miami, FL": 141, "Nashville, TN": 112, "New York, NY": 185,
  "San Francisco, CA": 191, "Seattle, WA": 158,
};
const CITIES = Object.keys(CITY_INDEXES);

function calc(values) {
  const ci = CITY_INDEXES[values.currentCity] || 100;
  const ti = CITY_INDEXES[values.targetCity] || 100;
  const multiplier = ti / ci;
  const pctChange = (multiplier - 1) * 100;
  const requiredSalary = values.salary * multiplier;
  const adjustedRent = values.monthlyRent * multiplier;
  const gap = requiredSalary - values.salary;
  return { multiplier, pctChange, requiredSalary, adjustedRent, gap };
}

const FAQS = [
  { question: "Does this calculator use live city data?", answer: "It uses realistic cost-of-living indexes for major US cities, making it useful for planning without depending on a live dataset. The indexes reflect relative purchasing power across cities." },
  { question: "Why does the required salary change more than rent?", answer: "The salary estimate reflects the broader city index, not just housing. It captures the idea that transportation, groceries, and other recurring costs move with the market too." },
  { question: "Can a lower salary still work in a higher-cost city?", answer: "Yes, if your personal spending pattern differs from the city average or if you expect stronger career growth. The tool is directional, not a guarantee." },
  { question: "Should I negotiate based on the required salary number?", answer: "It's a good starting point for negotiation because it frames the move in purchasing-power terms rather than only in headline pay." },
];

export default function CostOfLiving() {
  const [inputs, setInputs] = useState({ currentCity: "Austin, TX", targetCity: "Seattle, WA", monthlyRent: 1850, salary: 90000 });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Cost of Living Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calc(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: typeof v === "string" && !CITIES.includes(v) ? parseFloat(v) || 0 : v }));
  const maxBar = result ? Math.max(result.requiredSalary, inputs.salary, result.adjustedRent * 12) : 1;
  const cheaper = result?.pctChange < 0;

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sky-400 text-xs font-mono">Lifestyle Calculator</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Cost of Living Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Compare two cities to see how your salary and rent need to change to maintain the same standard of living.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-slate-200 mb-5">Your Scenario</h3>
              <div className="space-y-4">
                {[
                  { key: "currentCity", label: "Current City", type: "select" },
                  { key: "targetCity", label: "Target City", type: "select" },
                  { key: "salary", label: "Current Annual Salary", prefix: "$" },
                  { key: "monthlyRent", label: "Current Monthly Rent", prefix: "$" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono">{f.label}</label>
                    {f.type === "select" ? (
                      <select value={inputs[f.key]} onChange={e => set(f.key, e.target.value)}
                        data-testid={`input-${f.key}`}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-3 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all">
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.prefix}</span>
                        <input type="number" value={inputs[f.key]} onChange={e => set(f.key, e.target.value)}
                          data-testid={`input-${f.key}`}
                          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 pl-8 pr-3 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all font-mono" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className={`border rounded-2xl p-6 ${cheaper ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                  <p className="text-xs text-slate-500 font-mono mb-2">COST ADJUSTMENT</p>
                  <p className={`font-heading font-bold text-xl ${cheaper ? "text-emerald-400" : "text-amber-400"}`} data-testid="col-recommendation">
                    {cheaper
                      ? `${inputs.targetCity} is ${Math.abs(result.pctChange).toFixed(1)}% cheaper — you could earn ${fmtCur(result.requiredSalary)} and maintain your lifestyle`
                      : `${inputs.targetCity} is ${result.pctChange.toFixed(1)}% more expensive — you'd need ${fmtCur(result.requiredSalary)} to maintain your lifestyle`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Required Salary", value: fmtCur(result.requiredSalary), color: cheaper ? "text-emerald-400" : "text-amber-400", testid: "required-salary" },
                    { label: "Salary Gap", value: `${result.gap >= 0 ? "+" : ""}${fmtCur(Math.abs(result.gap))}`, color: result.gap > 0 ? "text-rose-400" : "text-emerald-400", testid: "salary-gap" },
                    { label: "Adjusted Monthly Rent", value: fmtCur(result.adjustedRent), testid: "adjusted-rent" },
                    { label: "Cost Index Change", value: fmtPct(result.pctChange), color: cheaper ? "text-emerald-400" : "text-amber-400" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5" data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="font-heading font-semibold text-slate-200 mb-2">Side-by-Side Comparison</h4>
                  <ComparisonBar label={`Annual salary — ${inputs.currentCity}`} value={inputs.salary} valueLabel={fmtCur(inputs.salary)} max={maxBar} color="#f59e0b" />
                  <ComparisonBar label={`Required salary — ${inputs.targetCity}`} value={result.requiredSalary} valueLabel={fmtCur(result.requiredSalary)} max={maxBar} color={cheaper ? "#10b981" : "#f87171"} />
                  <ComparisonBar label={`Annual rent — ${inputs.currentCity}`} value={inputs.monthlyRent * 12} valueLabel={fmtCur(inputs.monthlyRent * 12)} max={maxBar} color="#6366f1" />
                  <ComparisonBar label={`Annual rent — ${inputs.targetCity}`} value={result.adjustedRent * 12} valueLabel={fmtCur(result.adjustedRent * 12)} max={maxBar} color={cheaper ? "#10b981" : "#f87171"} />
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
