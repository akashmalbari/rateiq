// pages/calculator.js
import { useState } from 'react';
import { getLiveRates, buildAmortizationSchedule } from '../lib/marketData';
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
    downPct: 20,
    rate: rates.mortgage30,
    years: 30,
  });
  const [result, setResult] = useState(null);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function calculate() {
    const principal = form.homePrice * (1 - form.downPct / 100);
    const sched = buildAmortizationSchedule(principal, parseFloat(form.rate), parseInt(form.years));
    setResult({ principal, ...sched });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <TickerBar rates={rates} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="rule-thick mb-1" /><div className="rule-thin mb-8" />
        <h2 className="text-4xl font-display font-bold mb-2">Mortgage Calculator</h2>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Build your full amortization schedule with current rates pre-loaded.
        </p>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Inputs */}
          <div style={{ background: 'white', border: '1px solid var(--border)', padding: '28px', borderRadius: '2px' }}>
            <h3 className="font-display font-bold text-lg mb-6">Loan Details</h3>

            {[
              { label: 'Home Price', key: 'homePrice', prefix: '$', type: 'number' },
              { label: 'Down Payment %', key: 'downPct', suffix: '%', type: 'number' },
              { label: 'Interest Rate %', key: 'rate', suffix: '%', type: 'number', step: 0.01 },
              { label: 'Loan Term (years)', key: 'years', type: 'number' },
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
                Quick pick (live rates)
              </div>
              <div className="flex gap-2">
                {[
                  { label: '30yr', val: rates.mortgage30 },
                  { label: '15yr', val: rates.mortgage15 },
                ].map(r => (
                  <button key={r.label} onClick={() => { update('rate', r.val); update('years', r.label === '15yr' ? 15 : 30); }}
                    style={{
                      padding: '6px 12px', fontFamily: 'monospace', fontSize: 12,
                      background: parseFloat(form.rate) === r.val ? 'var(--ink)' : 'white',
                      color: parseFloat(form.rate) === r.val ? 'var(--gold)' : 'var(--ink)',
                      border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '2px',
                    }}>
                    {r.label} — {r.val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm font-mono mb-4" style={{ color: 'var(--muted)' }}>
              Loan Amount: <strong style={{ color: 'var(--ink)' }}>
                {fmt(form.homePrice * (1 - form.downPct / 100))}
              </strong>
            </div>

            <button onClick={calculate} style={{
              width: '100%', background: 'var(--ink)', color: 'var(--gold)',
              padding: '14px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 'bold',
              letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none',
              cursor: 'pointer', borderRadius: '2px',
            }}>
              Calculate Schedule
            </button>
          </div>

          {/* Results summary */}
          <div>
            {result ? (
              <div className="fade-up">
                <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '24px', borderRadius: '2px', marginBottom: '16px' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
                    Monthly Payment
                  </div>
                  <div className="text-5xl font-display font-bold mb-1" style={{ color: 'var(--gold)' }}>
                    {fmt(result.monthlyPayment)}
                  </div>
                  <div className="text-xs font-mono" style={{ color: '#888' }}>Principal & Interest only · Add taxes/insurance (~25%)</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Total Paid', value: fmt(result.totalPaid) },
                    { label: 'Total Interest', value: fmt(result.totalInterest), warn: true },
                    { label: 'Loan Amount', value: fmt(result.principal) },
                    { label: 'Interest %', value: `${Math.round(result.totalInterest / result.totalPaid * 100)}%`, warn: true },
                  ].map(({ label, value, warn }) => (
                    <div key={label} style={{ background: 'white', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: '2px' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
                      <div className="font-bold font-display text-xl" style={{ color: warn ? 'var(--red)' : 'var(--ink)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Schedule table */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--ink)', color: 'var(--gold)', padding: '10px 16px' }}
                       className="text-xs font-mono uppercase tracking-widest">
                    Amortization Schedule (Year-by-Year)
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--cream)' }}>
                        <tr>
                          {['Year', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.filter(r => r.month % 12 === 0 || r.month === 1).map((row, i) => (
                          <tr key={row.month} style={{ background: i % 2 === 0 ? 'white' : 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '7px 12px', textAlign: 'right' }}>Yr {row.year}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'right' }}>{fmt(row.payment)}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--green)' }}>{fmt(row.principal)}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--red)' }}>{fmt(row.interest)}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--border)', borderRadius: '2px', height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center font-mono text-sm" style={{ color: 'var(--muted)' }}>
                  <div className="text-4xl mb-3">📊</div>
                  <div>Fill in the details and click Calculate</div>
                  <div className="mt-1 text-xs">Your amortization schedule will appear here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
