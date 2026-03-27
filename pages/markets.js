// pages/markets.js
import { getLiveRates, REAL_ESTATE_MARKETS } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

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

        {/* Disclaimer */}
        <p className="text-xs font-mono text-center" style={{ color: 'var(--muted)' }}>
          All data for informational purposes only. Past performance does not guarantee future results.
          Real estate appreciation rates are historical averages. This is not financial advice.
        </p>
      </div>
    </div>
  );
}
