import { useState } from 'react';
import { getLiveRates } from '../lib/marketData';
import { calculateBuyVsInvest } from '../lib/buyVsInvest';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function CalculatorPage({ rates }) {
  const [form, setForm] = useState({
    homePrice: 400000,
    downPayment: 80000,
    interestRate: rates.mortgage30,
    loanTermYears: 30,
    expectedReturnRate: 8,
    yearsHeld: 10,
  });
  const [result, setResult] = useState(() => calculateBuyVsInvest({
    homePrice: 400000,
    downPayment: 80000,
    interestRate: rates.mortgage30,
    loanTermYears: 30,
    expectedReturnRate: 8,
    yearsHeld: 10,
  }));

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function calculate() {
    setResult(calculateBuyVsInvest({
      homePrice: parseFloat(form.homePrice),
      downPayment: parseFloat(form.downPayment),
      interestRate: parseFloat(form.interestRate),
      loanTermYears: parseFloat(form.loanTermYears),
      expectedReturnRate: parseFloat(form.expectedReturnRate),
      yearsHeld: parseFloat(form.yearsHeld),
    }));
  }

  const isInvestWinner = result?.winner === 'invest';
  const yearsHeldLabel = `${Number(form.yearsHeld) || 0} year${Number(form.yearsHeld) === 1 ? '' : 's'}`;
  const headline = isInvestWinner
    ? `Investing beats buying by ${fmt(result.netDifference)} over ${yearsHeldLabel}`
    : `Buying builds more wealth by ${fmt(result.netDifference)} over ${yearsHeldLabel}`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <TickerBar rates={rates} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="rule-thick mb-1" /><div className="rule-thin mb-8" />
        <h2 className="text-4xl font-display font-bold mb-2">Buy vs Invest Calculator</h2>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Compare home equity against investing the same dollars in the market.
        </p>

        <div className="grid md:grid-cols-2 gap-10">
          <div style={{ background: 'white', border: '1px solid var(--border)', padding: '28px', borderRadius: '2px' }}>
            <h3 className="font-display font-bold text-lg mb-6">Scenario Inputs</h3>

            {[
              { label: 'Home Price', key: 'homePrice', prefix: '$', type: 'number' },
              { label: 'Down Payment', key: 'downPayment', prefix: '$', type: 'number' },
              { label: 'Interest Rate', key: 'interestRate', suffix: '%', type: 'number', step: 0.01 },
              { label: 'Loan Term (years)', key: 'loanTermYears', type: 'number' },
              { label: 'Expected Market Return', key: 'expectedReturnRate', suffix: '%', type: 'number', step: 0.01 },
              { label: 'Years Held', key: 'yearsHeld', type: 'number' },
            ].map(({ label, key, prefix, suffix, type, step }) => (
              <div key={key} className="mb-4">
                <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>{prefix}</span>}
                  <input
                    type={type}
                    step={step || 1}
                    value={form[key]}
                    onChange={e => update(key, e.target.value)}
                    style={{ paddingLeft: prefix ? 24 : 14, paddingRight: suffix ? 28 : 14 }}
                  />
                  {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>{suffix}</span>}
                </div>
              </div>
            ))}

            {/* Rate quick-pick */}
            <div className="mb-6">
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                Quick pick mortgage rates
              </div>
              <div className="flex gap-2">
                {[
                  { label: '30yr', val: rates.mortgage30 },
                  { label: '15yr', val: rates.mortgage15 },
                ].map(r => (
                  <button key={r.label} onClick={() => { update('interestRate', r.val); update('loanTermYears', r.label === '15yr' ? 15 : 30); }}
                    style={{
                      padding: '6px 12px', fontFamily: 'monospace', fontSize: 12,
                      background: parseFloat(form.interestRate) === r.val ? 'var(--ink)' : 'white',
                      color: parseFloat(form.interestRate) === r.val ? 'var(--gold)' : 'var(--ink)',
                      border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '2px',
                    }}>
                    {r.label} — {r.val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm font-mono mb-4" style={{ color: 'var(--muted)' }}>
              Loan Amount: <strong style={{ color: 'var(--ink)' }}>
                {fmt(Math.max(form.homePrice - form.downPayment, 0))}
              </strong>
            </div>

            <button onClick={calculate} style={{
              width: '100%', background: 'var(--ink)', color: 'var(--gold)',
              padding: '14px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 'bold',
              letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none',
              cursor: 'pointer', borderRadius: '2px',
            }}>
              Compare Buy vs Invest
            </button>
          </div>

          <div>
            {result ? (
              <div className="fade-up">
                <div style={{
                  background: isInvestWinner ? 'var(--green)' : 'var(--ink)',
                  color: 'var(--paper)',
                  padding: '24px',
                  borderRadius: '2px',
                  marginBottom: '16px',
                }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
                    Decision
                  </div>
                  <div className="text-3xl md:text-4xl font-display font-bold mb-3" style={{ color: 'var(--gold)', lineHeight: 1.15 }}>
                    {headline}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '14px 16px', borderRadius: '2px' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(245, 240, 232, 0.75)' }}>
                        Total Home Cost
                      </div>
                      <div className="text-2xl font-display font-bold">
                        {fmt(result.totalCostOfOwning)}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '14px 16px', borderRadius: '2px' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(245, 240, 232, 0.75)' }}>
                        Investment Value
                      </div>
                      <div className="text-2xl font-display font-bold">
                        {fmt(result.futureValueOfInvesting)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Total Cost of Owning', value: fmt(result.totalCostOfOwning) },
                    { label: 'Future Value if Invested', value: fmt(result.futureValueOfInvesting), positive: true },
                    { label: 'Home Equity After Hold', value: fmt(result.homeEquityAfterYearsHeld) },
                    { label: 'Net Difference', value: fmt(result.netDifference), positive: isInvestWinner },
                    { label: 'Monthly Mortgage', value: fmt(result.monthlyMortgagePayment) },
                    { label: 'Interest Paid', value: fmt(result.totalInterestPaid) },
                    { label: 'Loan Amount', value: fmt(result.loanAmount) },
                    { label: 'Balance Remaining', value: fmt(result.remainingMortgageBalance) },
                  ].map(({ label, value, warn }) => (
                    <div key={label} style={{ background: 'white', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: '2px' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
                      <div className="font-bold font-display text-xl" style={{ color: label === 'Interest Paid' ? 'var(--red)' : label === 'Future Value if Invested' || (label === 'Net Difference' && isInvestWinner) ? 'var(--green)' : 'var(--ink)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                    How this works
                  </div>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                    Buying tracks mortgage amortization and compares the equity you build over your holding period.
                    Investing assumes the down payment is invested up front and the same monthly cash goes into the market instead.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--border)', borderRadius: '2px', height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center font-mono text-sm" style={{ color: 'var(--muted)' }}>
                  <div className="text-4xl mb-3">$</div>
                  <div>Fill in the details and click Calculate</div>
                  <div className="mt-1 text-xs">Your buy vs invest comparison will appear here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
