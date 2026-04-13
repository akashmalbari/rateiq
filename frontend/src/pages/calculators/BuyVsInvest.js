import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ComparisonBar } from "../../components/ComparisonBar";
import { FAQSection } from "../../components/FAQSection";

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

function monthlyPayment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function calcBuyVsInvest({ homePrice, downPayment, interestRate, loanTermYears, expectedReturnRate, yearsHeld, propertyAppreciationRate }) {
  const safeDown = Math.min(Math.max(downPayment, 0), homePrice);
  const loanAmount = Math.max(homePrice - safeDown, 0);
  const totalLoanMonths = Math.max(1, Math.round(loanTermYears * 12));
  const totalHeldMonths = Math.floor(yearsHeld * 12);
  const mortgageMonthsPaid = Math.min(totalHeldMonths, totalLoanMonths);
  const monthlyPmt = monthlyPayment(loanAmount, interestRate, totalLoanMonths);
  const mortgageRate = interestRate / 100 / 12;
  const investRate = expectedReturnRate / 100 / 12;

  let balance = loanAmount;
  let totalInterest = 0;
  let totalPaid = 0;
  let investBal = safeDown;

  for (let m = 0; m < totalHeldMonths; m++) {
    investBal *= 1 + investRate;
    if (m < mortgageMonthsPaid) {
      const interest = mortgageRate === 0 ? 0 : balance * mortgageRate;
      const principal = monthlyPmt - interest;
      totalInterest += interest;
      totalPaid += monthlyPmt;
      balance = Math.max(0, balance - principal);
      investBal += monthlyPmt;
    }
  }

  if (totalHeldMonths === 0) investBal = safeDown;

  const appreciated = homePrice * Math.pow(1 + propertyAppreciationRate / 100, yearsHeld);
  const equity = Math.max(appreciated - balance, 0);
  const netDiff = investBal - equity;
  const winner = netDiff >= 0 ? 'invest' : 'buy';

  const chartData = [];
  let cBalance = loanAmount, cInvest = safeDown;
  for (let y = 1; y <= yearsHeld; y++) {
    const months = y * 12;
    const prevMonths = (y - 1) * 12;
    let b2 = cBalance;
    let inv2 = cInvest;
    for (let m = prevMonths; m < months; m++) {
      inv2 *= 1 + investRate;
      if (m < mortgageMonthsPaid) {
        const int2 = mortgageRate === 0 ? 0 : b2 * mortgageRate;
        const pr2 = monthlyPmt - int2;
        b2 = Math.max(0, b2 - pr2);
        inv2 += monthlyPmt;
      }
    }
    const appHome = homePrice * Math.pow(1 + propertyAppreciationRate / 100, y);
    const eq2 = Math.max(appHome - b2, 0);
    chartData.push({ year: y, "Investing (Net)": Math.round(inv2), "Home Equity": Math.round(eq2) });
    cBalance = b2;
    cInvest = inv2;
  }

  return {
    loanAmount: Math.round(loanAmount),
    monthlyMortgage: Math.round(monthlyPmt),
    totalInterest: Math.round(totalInterest),
    appreciatedHomeValue: Math.round(appreciated),
    equity: Math.round(equity),
    investmentValue: Math.round(investBal),
    netDiff: Math.round(Math.abs(netDiff)),
    winner,
    chartData,
  };
}

const FAQS = [
  { question: "Does this include property taxes and maintenance?", answer: "This simplified model focuses on mortgage vs investment compounding. For a complete analysis including taxes and maintenance, use the Rent vs Buy calculator which accounts for those costs." },
  { question: "Why does the investment scenario sometimes win?", answer: "When your down payment stays invested instead of going into a home, compound interest can build wealth faster — especially when mortgage rates are high relative to investment returns." },
  { question: "What investment return should I assume?", answer: "The S&P 500 has historically returned ~10% annually before inflation. For conservative planning, 7-8% is common. This model uses whatever rate you enter." },
  { question: "Does appreciation rate matter a lot?", answer: "Yes. Even small differences in home appreciation (3% vs 5%) can significantly change whether buying or investing wins over long horizons. Try different scenarios." },
];

export default function BuyVsInvest() {
  const [inputs, setInputs] = useState({
    homePrice: 500000, downPayment: 100000, interestRate: 6.8, loanTermYears: 30,
    expectedReturnRate: 8, yearsHeld: 10, propertyAppreciationRate: 4,
  });
  const [result, setResult] = useState(null);

  useEffect(() => { document.title = "Buy vs Invest Calculator 2026 | FigureMyMoney"; }, []);
  useEffect(() => { setResult(calcBuyVsInvest(inputs)); }, [inputs]);

  const set = (k, v) => setInputs(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const buyWins = result?.winner === 'buy';
  const maxBar = result ? Math.max(result.equity, result.investmentValue) : 1;

  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-indigo-400 text-xs font-mono">Housing vs Wealth</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="calc-title">Buy vs Invest Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Compare building home equity vs investing your down payment and mortgage payments in the stock market.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-semibold text-slate-200 mb-1">Scenario Inputs</h3>
              {[
                { key: "homePrice", label: "Home Price", prefix: "$" },
                { key: "downPayment", label: "Down Payment", prefix: "$" },
                { key: "interestRate", label: "Mortgage Rate", suffix: "%" },
                { key: "loanTermYears", label: "Loan Term", suffix: "yr" },
                { key: "propertyAppreciationRate", label: "Home Appreciation Rate", suffix: "%" },
                { key: "expectedReturnRate", label: "Investment Return Rate", suffix: "%" },
                { key: "yearsHeld", label: "Years Held", suffix: "yr" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono">{f.label}</label>
                  <div className="relative">
                    {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.prefix}</span>}
                    <input type="number" value={inputs[f.key]} onChange={e => set(f.key, e.target.value)}
                      data-testid={`input-${f.key}`}
                      className={`w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all font-mono ${f.prefix ? "pl-8 pr-3" : "px-3"}`} />
                    {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                <div className={`border rounded-2xl p-6 ${buyWins ? "bg-amber-500/5 border-amber-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
                  <p className="text-xs text-slate-500 font-mono mb-2">VERDICT</p>
                  <p className={`font-heading font-bold text-xl ${buyWins ? "text-amber-400" : "text-blue-400"}`} data-testid="buy-invest-verdict">
                    {buyWins
                      ? `Buying builds ${fmtCur(result.netDiff)} more wealth over ${inputs.yearsHeld} years`
                      : `Investing builds ${fmtCur(result.netDiff)} more wealth over ${inputs.yearsHeld} years`
                    }
                  </p>
                  <p className="text-sm text-slate-400 mt-2">Comparing home equity vs invested portfolio value at year {inputs.yearsHeld}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Home Equity at Exit", value: fmtCur(result.equity), color: "text-amber-400", testid: "home-equity" },
                    { label: "Investment Portfolio Value", value: fmtCur(result.investmentValue), color: "text-blue-400", testid: "invest-value" },
                    { label: "Monthly Mortgage", value: fmtCur(result.monthlyMortgage) },
                    { label: "Total Interest Paid", value: fmtCur(result.totalInterest) },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#151A22]/80 border border-white/5 rounded-xl p-5" data-testid={s.testid}>
                      <p className="text-xs text-slate-500 font-mono mb-2">{s.label}</p>
                      <p className={`font-mono font-bold text-2xl ${s.color || "text-slate-100"}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="font-heading font-semibold text-slate-200 mb-2">Wealth at Year {inputs.yearsHeld}</h4>
                  <ComparisonBar label="Home Equity" value={result.equity} valueLabel={fmtCur(result.equity)} max={maxBar} color="#f59e0b" />
                  <ComparisonBar label="Investment Portfolio" value={result.investmentValue} valueLabel={fmtCur(result.investmentValue)} max={maxBar} color="#3b82f6" />
                </div>

                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
                  <h4 className="font-heading font-semibold text-slate-200 mb-6">Wealth Growth Over Time</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="buyGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Year", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : (v / 1000).toFixed(0) + "k"}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px", color: "#94a3b8" }} />
                      <Area type="monotone" dataKey="Investing (Net)" stroke="#3b82f6" fill="url(#investGrad)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="Home Equity" stroke="#f59e0b" fill="url(#buyGrad2)" strokeWidth={2} dot={false} />
                    </AreaChart>
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
