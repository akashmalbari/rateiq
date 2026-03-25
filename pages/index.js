// pages/index.js
import { getLiveRates, INDEX_FUNDS, REAL_ESTATE_MARKETS } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';
import RateCard from '../components/RateCard';
import Link from 'next/link';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard({ rates }) {
  const topMarkets = REAL_ESTATE_MARKETS.slice(0, 6);
  const topFunds   = INDEX_FUNDS.slice(0, 4);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <TickerBar rates={rates} />

      {/* Hero */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="rule-thick mb-6" />
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest mb-3"
                   style={{ color: 'var(--gold)' }}>
                Your Capital. Your Decision. Our Intelligence.
              </div>
              <h2 className="text-5xl font-display font-bold mb-4" style={{ lineHeight: 1.1 }}>
                Should you buy a home<br />or invest in the market?
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }} className="mb-6">
                Tell us how much capital you have. We'll analyze current mortgage rates,
                real estate appreciation by city, and index fund returns to give you
                a data-driven allocation strategy.
              </p>
              <Link href="/advisor">
                <button style={{
                  background: 'var(--ink)', color: 'var(--gold)',
                  padding: '14px 32px', fontFamily: 'inherit',
                  fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.1em',
                  textTransform: 'uppercase', border: 'none', cursor: 'pointer',
                  borderRadius: '2px',
                }}>
                  Get My Allocation →
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <RateCard label="30yr Mortgage" value={`${rates.mortgage30.toFixed(2)}%`} sub="Weekly avg — FRED" highlight />
              <RateCard label="15yr Mortgage" value={`${rates.mortgage15.toFixed(2)}%`} sub="Weekly avg — FRED" />
              <RateCard label="Fed Funds Rate" value={`${rates.fedFunds.toFixed(2)}%`} sub="Current target" />
              <RateCard label="Prime Rate"     value={`${rates.prime.toFixed(2)}%`}    sub="Fed Funds + 3%" />
            </div>
          </div>
        </div>
      </div>

      {/* Real Estate Markets */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="rule-thick mb-1" />
        <div className="rule-thin mb-6" />
        <div className="flex items-baseline justify-between mb-6">
          <h3 className="text-2xl font-display font-bold">Real Estate Markets</h3>
          <span className="text-xs font-mono uppercase" style={{ color: 'var(--muted)' }}>
            Avg Annual Appreciation · Zillow/FHFA Historical
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {topMarkets.map(m => (
            <div key={m.city} style={{ background: 'white', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: '2px' }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-sm">{m.city}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{m.region}</div>
                </div>
                <div style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '18px', fontFamily: 'Georgia, serif' }}>
                  +{m.annualAppreciation}%
                  <span className="text-xs font-mono font-normal" style={{ color: 'var(--muted)' }}>/yr</span>
                </div>
              </div>
              <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--muted)' }}>
                <span>Median: <strong style={{ color: 'var(--ink)' }}>{fmt(m.medianHome)}</strong></span>
                <span>Rent yield: <strong style={{ color: 'var(--ink)' }}>{m.rentYield}%</strong></span>
              </div>
            </div>
          ))}
        </div>
        <Link href="/markets" className="text-xs font-mono uppercase tracking-wide"
              style={{ color: 'var(--muted)', textDecoration: 'underline' }}>
          View all 15 markets →
        </Link>
      </div>

      {/* Index Funds */}
      <div style={{ background: 'var(--ink)', color: 'var(--paper)' }} className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div style={{ borderTop: '3px solid var(--gold)', marginBottom: '4px' }} />
          <div style={{ borderTop: '1px solid var(--gold)', marginBottom: '24px' }} />
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="text-2xl font-display font-bold" style={{ color: 'var(--gold)' }}>
              Index Fund Snapshot
            </h3>
            <span className="text-xs font-mono uppercase" style={{ color: 'var(--muted)' }}>
              10yr Historical Returns
            </span>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {topFunds.map(f => (
              <div key={f.ticker} style={{ border: '1px solid #333', padding: '16px 20px', borderRadius: '2px' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-lg" style={{ color: 'var(--gold)' }}>{f.ticker}</span>
                  <span className="text-xs font-mono px-2 py-1 rounded"
                        style={{ background: '#1a1a1a', color: '#aaa' }}>{f.risk}</span>
                </div>
                <div className="text-xs mb-3" style={{ color: '#888' }}>{f.name}</div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[['1yr', f.historicReturn1yr], ['5yr', f.historicReturn5yr], ['10yr', f.historicReturn10yr]].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ color: val > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
                        {val > 0 ? '+' : ''}{val}%
                      </div>
                      <div className="text-xs font-mono" style={{ color: '#666' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs font-mono" style={{ color: '#555' }}>
                  Expense: {f.expenseRatio}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--gold)', color: 'var(--ink)' }} className="py-12">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-display font-bold mb-3">
            Ready to allocate your capital?
          </h3>
          <p className="mb-6 font-mono text-sm" style={{ opacity: 0.8 }}>
            Tell us your budget, timeline, and risk tolerance —<br />
            we'll build your personalized investment breakdown.
          </p>
          <Link href="/advisor">
            <button style={{
              background: 'var(--ink)', color: 'var(--gold)',
              padding: '14px 40px', fontFamily: 'inherit',
              fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.1em',
              textTransform: 'uppercase', border: 'none', cursor: 'pointer',
              borderRadius: '2px',
            }}>
              Start My Analysis →
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '3px solid var(--ink)', background: 'var(--cream)' }} className="py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs font-mono"
             style={{ color: 'var(--muted)' }}>
          <div>© 2025 RateIQ · Not financial advice. For informational purposes only.</div>
          <div>Rate data: FRED/Federal Reserve · Market data: delayed 15min</div>
        </div>
      </footer>
    </div>
  );
}
