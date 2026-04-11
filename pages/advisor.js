// pages/advisor.js
import { useState } from 'react';
import Head from 'next/head';
import { getLiveRates, REAL_ESTATE_MARKETS, INDEX_FUNDS, getAllocationAdvice, compareBuyVsInvest } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';
import SiteFooter from '../components/SiteFooter';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function pct(n) { return `${n.toFixed(1)}%`; }

const STEPS = ['capital', 'profile', 'results'];

export default function AdvisorPage({ rates }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    capital: '',
    hasHome: 'no',
    riskTolerance: 'moderate',
    timeHorizon: 10,
    selectedMarket: REAL_ESTATE_MARKETS[0].city,
    downPaymentPct: 20,
  });
  const [results, setResults] = useState(null);

  function update(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function compute() {
    const capital = parseFloat(form.capital.replace(/[^0-9.]/g, ''));
    if (!capital) return;

    const market = REAL_ESTATE_MARKETS.find(m => m.city === form.selectedMarket);
    const allocation = getAllocationAdvice({
      capital,
      riskTolerance: form.riskTolerance,
      hasHome: form.hasHome === 'yes',
      timeHorizon: parseInt(form.timeHorizon),
    });

    const comparison = compareBuyVsInvest({
      capital,
      downPaymentPct: form.downPaymentPct,
      homePrice: market.medianHome,
      mortgageRate: rates.mortgage30,
      termYears: 30,
      holdYears: parseInt(form.timeHorizon),
      marketAppreciation: market.annualAppreciation,
      investmentReturn: 10.5,
      rentMonthly: market.medianHome * 0.004,
    });

    // Recommended funds based on risk
    let recommendedFunds;
    if (form.riskTolerance === 'conservative') {
      recommendedFunds = ['BND', 'VOO', 'VXUS'];
    } else if (form.riskTolerance === 'moderate') {
      recommendedFunds = ['VOO', 'VTI', 'VXUS'];
    } else {
      recommendedFunds = ['QQQ', 'VOO', 'VTI'];
    }
    const funds = INDEX_FUNDS.filter(f => recommendedFunds.includes(f.ticker));

    setResults({ capital, allocation, comparison, market, funds });
    setStep(2);
  }

  const AllocBar = ({ label, pct: p, color }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1 text-sm font-mono">
        <span>{label}</span>
        <span className="font-bold">{p}%</span>
      </div>
      <div style={{ background: 'var(--border)', height: '12px', borderRadius: '2px', overflow: 'hidden' }}>
        <div className="alloc-bar" style={{ width: `${p}%`, background: color, height: '100%', borderRadius: '2px' }} />
      </div>
    </div>
  );

  const title = 'Capital Allocation Advisor | Figure My Money';
  const description = 'Personalized capital allocation guidance across market, real estate, bonds, and cash based on your profile.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        <TickerBar rates={rates} />

        <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-10 font-mono text-xs uppercase tracking-widest">
          {['Your Capital', 'Your Profile', 'Your Analysis'].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i <= step ? 'var(--ink)' : 'var(--border)',
                color: i <= step ? 'var(--gold)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '13px',
              }}>{i + 1}</div>
              <span style={{ color: i === step ? 'var(--ink)' : 'var(--muted)' }}>{s}</span>
              {i < 2 && <span style={{ color: 'var(--border)' }}>—</span>}
            </div>
          ))}
        </div>

        {/* Step 0: Capital */}
        {step === 0 && (
          <div>
            <div className="rule-thick mb-1" /><div className="rule-thin mb-8" />
            <h2 className="text-4xl font-display font-bold mb-2">How much capital do you have?</h2>
            <p className="mb-8 font-mono text-sm" style={{ color: 'var(--muted)' }}>
              Enter the total amount you're looking to invest or deploy.
            </p>
            <div className="mb-6" style={{ maxWidth: 360 }}>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                Total Capital Available
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 16 }}>$</span>
                <input
                  type="number"
                  placeholder="250,000"
                  value={form.capital}
                  onChange={e => update('capital', e.target.value)}
                  style={{ paddingLeft: 28, fontSize: 20, fontFamily: 'Georgia, serif', fontWeight: 'bold' }}
                />
              </div>
              {form.capital && (
                <div className="mt-2 text-sm font-mono" style={{ color: 'var(--green)' }}>
                  = {fmt(parseFloat(form.capital || 0))}
                </div>
              )}
            </div>
            <button
              onClick={() => form.capital && setStep(1)}
              disabled={!form.capital}
              style={{
                background: form.capital ? 'var(--ink)' : 'var(--border)',
                color: form.capital ? 'var(--gold)' : 'var(--muted)',
                padding: '14px 36px', fontFamily: 'inherit',
                fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.1em',
                textTransform: 'uppercase', border: 'none',
                cursor: form.capital ? 'pointer' : 'not-allowed', borderRadius: '2px',
              }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div>
            <div className="rule-thick mb-1" /><div className="rule-thin mb-8" />
            <h2 className="text-4xl font-display font-bold mb-2">Tell us about yourself</h2>
            <p className="mb-8 font-mono text-sm" style={{ color: 'var(--muted)' }}>
              We'll use this to tailor your allocation and pick the right markets.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                  Do you already own a home?
                </label>
                <div className="flex gap-3">
                  {['yes', 'no'].map(v => (
                    <button key={v} onClick={() => update('hasHome', v)}
                      style={{
                        flex: 1, padding: '10px', fontFamily: 'inherit', fontSize: 13,
                        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold',
                        background: form.hasHome === v ? 'var(--ink)' : 'white',
                        color: form.hasHome === v ? 'var(--gold)' : 'var(--ink)',
                        border: `1px solid ${form.hasHome === v ? 'var(--ink)' : 'var(--border)'}`,
                        cursor: 'pointer', borderRadius: '2px',
                      }}>
                      {v === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                  Risk Tolerance
                </label>
                <select value={form.riskTolerance} onChange={e => update('riskTolerance', e.target.value)}>
                  <option value="conservative">Conservative — Preserve capital</option>
                  <option value="moderate">Moderate — Balanced growth</option>
                  <option value="aggressive">Aggressive — Max returns</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                  Investment Horizon: <strong>{form.timeHorizon} years</strong>
                </label>
                <input type="range" min={1} max={30} value={form.timeHorizon}
                  onChange={e => update('timeHorizon', e.target.value)} />
                <div className="flex justify-between text-xs font-mono mt-1" style={{ color: 'var(--muted)' }}>
                  <span>1yr</span><span>15yr</span><span>30yr</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                  Real Estate Market of Interest
                </label>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    background: 'white',
                    padding: '6px',
                  }}
                >
                  {REAL_ESTATE_MARKETS.map((m) => {
                    const active = form.selectedMarket === m.city;
                    return (
                      <button
                        key={m.city}
                        type="button"
                        onClick={() => update('selectedMarket', m.city)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          marginBottom: 4,
                          borderRadius: '2px',
                          border: `1px solid ${active ? 'var(--ink)' : 'var(--border)'}`,
                          background: active ? 'var(--ink)' : 'white',
                          color: active ? 'var(--gold)' : 'var(--ink)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 14,
                        }}
                      >
                        {m.city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.hasHome === 'no' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                    Down Payment if Buying: <strong>{form.downPaymentPct}%</strong>
                  </label>
                  <input type="range" min={5} max={50} step={5} value={form.downPaymentPct}
                    onChange={e => update('downPaymentPct', e.target.value)} />
                  <div className="flex justify-between text-xs font-mono mt-1" style={{ color: 'var(--muted)' }}>
                    <span>5%</span><span>20% (conventional)</span><span>50%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setStep(0)} style={{
                background: 'white', color: 'var(--ink)', padding: '14px 24px',
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 'bold',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '2px',
              }}>← Back</button>
              <button onClick={compute} style={{
                background: 'var(--ink)', color: 'var(--gold)', padding: '14px 36px',
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 'bold',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer', borderRadius: '2px',
              }}>Run My Analysis →</button>
            </div>
          </div>
        )}

        {/* Step 2: Results */}
        {step === 2 && results && (
          <div className="fade-up">
            <div className="rule-thick mb-1" /><div className="rule-thin mb-8" />

            {/* Headline */}
            <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '24px 28px', marginBottom: '32px', borderRadius: '2px' }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--gold)' }}>
                Your Personalized Analysis
              </div>
              <div className="text-3xl font-display font-bold mb-2">
                {fmt(results.capital)} over {form.timeHorizon} years
              </div>
              <div className="text-sm font-mono" style={{ color: '#aaa' }}>
                Projected value: <span style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '20px' }}>
                  {fmt(results.allocation.futureValue)}
                </span> at {results.allocation.projectedAnnualReturn}% blended annual return
              </div>
            </div>

            {/* Allocation */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div style={{ background: 'white', border: '1px solid var(--border)', padding: '24px', borderRadius: '2px' }}>
                <h3 className="font-display font-bold text-xl mb-6">Recommended Allocation</h3>
                <AllocBar label="📈 Stock Market"  pct={results.allocation.allocations.market}     color="var(--ink)" />
                <AllocBar label="🏠 Real Estate"   pct={results.allocation.allocations.realEstate} color="var(--gold)" />
                <AllocBar label="📊 Bonds"          pct={results.allocation.allocations.bonds}      color="#888" />
                <AllocBar label="💵 Cash / HYSA"   pct={results.allocation.allocations.cash}       color="#bbb" />

                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Market $</div>
                      <div className="font-bold">{fmt(results.capital * results.allocation.allocations.market / 100)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Real Estate $</div>
                      <div className="font-bold">{fmt(results.capital * results.allocation.allocations.realEstate / 100)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Bonds $</div>
                      <div className="font-bold">{fmt(results.capital * results.allocation.allocations.bonds / 100)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Cash $</div>
                      <div className="font-bold">{fmt(results.capital * results.allocation.allocations.cash / 100)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buy vs Invest */}
              <div style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: '2px' }}>
                <h3 className="font-display font-bold text-xl mb-2">Buy vs. Invest</h3>
                <div className="text-xs font-mono mb-4" style={{ color: 'var(--muted)' }}>
                  {results.market.city} · {form.timeHorizon}yr horizon · 30yr at {rates.mortgage30}%
                </div>

                <div className="mb-4 p-4 rounded" style={{
                  background: results.comparison.winner === 'invest' ? '#f0fdf4' : '#fefce8',
                  border: `2px solid ${results.comparison.winner === 'invest' ? 'var(--green)' : 'var(--gold)'}`,
                }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-1"
                       style={{ color: results.comparison.winner === 'invest' ? 'var(--green)' : '#92400e' }}>
                    {results.comparison.winner === 'invest' ? '📈 Market Wins' : '🏠 Real Estate Wins'}
                  </div>
                  <div className="font-bold text-lg">
                    {fmt(results.comparison.difference)} advantage over {form.timeHorizon} years
                  </div>
                </div>

                <div className="space-y-3">
                  <div style={{ background: 'var(--cream)', padding: '12px 16px', borderRadius: '2px' }}>
                    <div className="text-xs font-mono uppercase" style={{ color: 'var(--muted)' }}>🏠 Buy in {results.market.city}</div>
                    <div className="font-bold">{fmt(results.comparison.realEstate.futureValue)}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                      Monthly PITI: ~{fmt(results.comparison.realEstate.monthlyPayment * 1.25)} ·
                      Total interest: {fmt(results.comparison.realEstate.totalInterest)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--cream)', padding: '12px 16px', borderRadius: '2px' }}>
                    <div className="text-xs font-mono uppercase" style={{ color: 'var(--muted)' }}>📈 Invest in Market (10.5% avg)</div>
                    <div className="font-bold">{fmt(results.comparison.invest.futureValue)}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                      Gain: {fmt(results.comparison.invest.gain)} · No maintenance costs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Funds */}
            <div style={{ background: 'var(--ink)', padding: '24px 28px', borderRadius: '2px', marginBottom: '24px' }}>
              <h3 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--gold)' }}>
                Recommended Index Funds
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {results.funds.map(f => (
                  <div key={f.ticker} style={{ border: '1px solid #333', padding: '16px', borderRadius: '2px' }}>
                    <div className="flex justify-between mb-2">
                      <span className="font-mono font-bold text-lg" style={{ color: 'var(--gold)' }}>{f.ticker}</span>
                      <span className="text-xs font-mono px-2 py-1" style={{ background: '#1a1a1a', color: '#888' }}>
                        {f.risk}
                      </span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: '#888' }}>{f.name}</div>
                    <div className="text-xs mb-3" style={{ color: '#666', lineHeight: 1.5 }}>{f.description}</div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#4ade80', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
                        +{f.historicReturn10yr}%
                      </span>
                      <span className="font-mono text-xs" style={{ color: '#555' }}>10yr avg</span>
                    </div>
                    <div className="text-xs font-mono mt-1" style={{ color: '#555' }}>Expense: {f.expenseRatio}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market insight */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '20px 24px', borderRadius: '2px', marginBottom: '24px' }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
                📍 Market Insight: {results.market.city}
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>Expected Appreciation</div>
                  <div className="font-bold font-display text-2xl" style={{ color: 'var(--green)' }}>
                    +{results.market.annualAppreciation}%<span className="text-sm font-sans font-normal" style={{ color: 'var(--muted)' }}>/yr</span>
                  </div>
                </div>
                <div>
                  <div className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>Median Home Price</div>
                  <div className="font-bold font-display text-2xl">{fmt(results.market.medianHome)}</div>
                </div>
                <div>
                  <div className="font-mono text-xs mb-1" style={{ color: 'var(--muted)' }}>Rental Yield</div>
                  <div className="font-bold font-display text-2xl" style={{ color: 'var(--ink)' }}>
                    {results.market.rentYield}%
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer + restart */}
            <div className="flex justify-between items-start">
              <p className="text-xs font-mono" style={{ color: 'var(--muted)', maxWidth: 480, lineHeight: 1.6 }}>
                ⚠️ This analysis is for informational purposes only and does not constitute financial advice.
                Past performance does not guarantee future results. Consult a licensed financial advisor
                before making investment decisions.
              </p>
              <button onClick={() => { setStep(0); setResults(null); }} style={{
                background: 'white', color: 'var(--ink)', padding: '10px 20px',
                fontFamily: 'inherit', fontSize: '12px', fontWeight: 'bold',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '2px',
              }}>
                ← Start Over
              </button>
            </div>
          </div>
        )}
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
