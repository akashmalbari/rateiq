// pages/markets.js
import { getLiveRates, REAL_ESTATE_MARKETS, INDEX_FUNDS } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const RISK_COLOR = {
  Low: '#1a6b3c',
  Moderate: '#92400e',
  'Moderate-High': '#c0392b',
  High: '#7b1d1d',
};

export default function MarketsPage({ rates }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <TickerBar rates={rates} />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Real Estate Markets */}
        <div className="rule-thick mb-1" /><div className="rule-thin mb-8" />
        <h2 className="text-3xl font-display font-bold mb-2">Real Estate Markets</h2>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Historical appreciation rates · Source: Zillow Research / FHFA · Updated annually
        </p>

        <div className="overflow-x-auto mb-12">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
            <thead>
              <tr style={{ background: 'var(--ink)', color: 'var(--gold)' }}>
                {['Market', 'Region', 'Annual Appreciation', 'Median Home', 'Rent Yield', 'Rating'].map(h => (
                  <th key={h} className="text-left text-xs font-mono uppercase tracking-wider"
                      style={{ padding: '12px 16px', borderRight: '1px solid #333' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REAL_ESTATE_MARKETS.sort((a, b) => b.annualAppreciation - a.annualAppreciation).map((m, i) => (
                <tr key={m.city} style={{ background: i % 2 === 0 ? 'white' : 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{m.city}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{m.region}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--green)', fontWeight: 'bold', fontFamily: 'Georgia, serif', fontSize: 18 }}>
                    +{m.annualAppreciation}%
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{fmt(m.medianHome)}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{m.rentYield}%</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: '2px',
                      background: m.annualAppreciation > 5 ? '#f0fdf4' : m.annualAppreciation > 4 ? '#fefce8' : '#f9fafb',
                      color: m.annualAppreciation > 5 ? 'var(--green)' : m.annualAppreciation > 4 ? '#92400e' : 'var(--muted)',
                      border: `1px solid ${m.annualAppreciation > 5 ? '#bbf7d0' : m.annualAppreciation > 4 ? '#fde68a' : 'var(--border)'}`,
                    }}>
                      {m.annualAppreciation > 5 ? 'Strong' : m.annualAppreciation > 4 ? 'Good' : 'Steady'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Index Funds */}
        <div style={{ background: 'var(--ink)' }} className="py-8 px-8 rounded-sm mb-8">
          <div style={{ borderTop: '3px solid var(--gold)', marginBottom: '4px' }} />
          <div style={{ borderTop: '1px solid var(--gold)', marginBottom: '24px' }} />
          <h2 className="text-3xl font-display font-bold mb-2" style={{ color: 'var(--gold)' }}>Index Fund Snapshot</h2>
          <p className="font-mono text-sm mb-8" style={{ color: '#888' }}>
            Major index ETFs · Expense ratios · Historical performance data
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {INDEX_FUNDS.map((f) => (
              <div key={f.ticker} style={{ border: '1px solid #222', padding: '20px 24px', borderRadius: '2px', background: '#0d0d0d' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono font-bold text-2xl" style={{ color: 'var(--gold)' }}>{f.ticker}</span>
                    <span className="ml-3 text-sm" style={{ color: '#888' }}>{f.index}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      padding: '4px 10px',
                      borderRadius: '2px',
                      background: '#1a1a1a',
                      color: RISK_COLOR[f.risk] || '#888',
                      border: `1px solid ${(RISK_COLOR[f.risk] || '#888')}33`,
                    }}
                  >
                    {f.risk}
                  </span>
                </div>
                <div className="text-sm mb-3" style={{ color: '#999', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {f.description}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ['1yr', f.historicReturn1yr],
                    ['5yr', f.historicReturn5yr],
                    ['10yr', f.historicReturn10yr],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#111', padding: '10px 6px', borderRadius: '2px' }}>
                      <div style={{ color: val > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', fontFamily: 'Georgia, serif', fontSize: 18 }}>
                        {val > 0 ? '+' : ''}{val}%
                      </div>
                      <div className="text-xs font-mono" style={{ color: '#555' }}>{label}</div>
                    </div>
                  ))}
                  <div style={{ background: '#111', padding: '10px 6px', borderRadius: '2px' }}>
                    <div style={{ color: '#aaa', fontWeight: 'bold', fontFamily: 'Georgia, serif', fontSize: 18 }}>
                      {f.expenseRatio}%
                    </div>
                    <div className="text-xs font-mono" style={{ color: '#555' }}>expense</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs font-mono text-center" style={{ color: 'var(--muted)' }}>
          All data for informational purposes only. Past performance does not guarantee future results.
          Real estate appreciation rates are historical averages. Index fund returns are trailing averages, net of expense ratios.
          This is not financial advice.
        </p>
      </div>
    </div>
  );
}
