import Head from 'next/head';
import { getLiveRates, INDEX_FUNDS } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';
import SiteFooter from '../components/SiteFooter';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

const RISK_COLOR = {
  Low: '#1a6b3c',
  Moderate: '#92400e',
  'Moderate-High': '#c0392b',
  High: '#7b1d1d',
};

export default function IndexFundsPage({ rates }) {
  const title = 'Index Funds Snapshot | Figure My Money';
  const description = 'Review major index ETFs, expense ratios, and historical return trends in one place.';

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

        <main className="max-w-7xl mx-auto px-6 py-10">
        <div style={{ background: 'var(--ink)' }} className="py-8 px-8 rounded-sm mb-8">
          <div style={{ borderTop: '3px solid var(--gold)', marginBottom: '4px' }} />
          <div style={{ borderTop: '1px solid var(--gold)', marginBottom: '24px' }} />
          <h1 className="text-3xl font-display font-bold mb-2" style={{ color: 'var(--gold)' }}>
            Index Funds
          </h1>
          <p className="font-mono text-sm mb-8" style={{ color: '#888' }}>
            Major index ETFs · Expense ratios · Historical performance data
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {INDEX_FUNDS.map((f) => (
              <div key={f.ticker} style={{ border: '1px solid #222', padding: '20px 24px', borderRadius: '2px', background: '#0d0d0d' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-mono font-bold text-2xl" style={{ color: 'var(--gold)' }}>
                      {f.ticker}
                    </span>
                    <span className="ml-3 text-sm" style={{ color: '#888' }}>
                      {f.index}
                    </span>
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
                        {val > 0 ? '+' : ''}
                        {val}%
                      </div>
                      <div className="text-xs font-mono" style={{ color: '#555' }}>
                        {label}
                      </div>
                    </div>
                  ))}
                  <div style={{ background: '#111', padding: '10px 6px', borderRadius: '2px' }}>
                    <div style={{ color: '#aaa', fontWeight: 'bold', fontFamily: 'Georgia, serif', fontSize: 18 }}>
                      {f.expenseRatio}%
                    </div>
                    <div className="text-xs font-mono" style={{ color: '#555' }}>
                      expense
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-mono text-center" style={{ color: 'var(--muted)' }}>
          All data for informational purposes only. Past performance does not guarantee future results.
          Index fund returns are trailing averages, net of expense ratios. This is not financial advice.
        </p>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
