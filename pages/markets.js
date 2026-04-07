// pages/markets.js
import { useMemo, useState } from 'react';
import Head from 'next/head';
import { getLiveRates, REAL_ESTATE_MARKETS, INDEX_FUNDS } from '../lib/marketData';
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

function projectedValue(base, annualPct, years) {
  return Math.round(base * Math.pow(1 + annualPct / 100, years));
}

const RISK_COLOR = {
  Low: '#1a6b3c',
  Moderate: '#92400e',
  'Moderate-High': '#c0392b',
  High: '#7b1d1d',
};

export default function MarketsPage({ rates }) {
  const title = 'Markets Dashboard | Figure My Money';
  const description = 'Track real estate market snapshots and index fund data for better financial comparisons.';

  const markets = useMemo(
    () => [...REAL_ESTATE_MARKETS].sort((a, b) => b.annualAppreciation - a.annualAppreciation),
    []
  );

  const [selectedCity, setSelectedCity] = useState('Miami, FL');
  const selectedMarket = markets.find((m) => m.city === selectedCity) || markets[0];

  const monthlyRentEstimate = Math.round((selectedMarket.medianHome * (selectedMarket.rentYield / 100)) / 12);
  const value5yr = projectedValue(selectedMarket.medianHome, selectedMarket.annualAppreciation, 5);
  const value10yr = projectedValue(selectedMarket.medianHome, selectedMarket.annualAppreciation, 10);

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
          {/* Real Estate Markets */}
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />
          <h1 className="text-3xl font-display font-bold mb-2">Real Estate Markets</h1>
          <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
            Click any city for detailed view · Source: Zillow Research / FHFA · Updated annually
          </p>

          {/* City Detail (works for Miami + all cities) */}
          <section
            className="mb-8"
            style={{ border: '1px solid var(--border)', background: 'white', borderRadius: '2px', padding: '20px' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                  Market detail
                </div>
                <h2 className="text-3xl font-display font-bold">{selectedMarket.city}</h2>
                <div className="text-sm font-mono" style={{ color: 'var(--muted)' }}>
                  {selectedMarket.region} region
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '2px',
                  background:
                    selectedMarket.annualAppreciation > 5
                      ? '#f0fdf4'
                      : selectedMarket.annualAppreciation > 4
                      ? '#fefce8'
                      : '#f9fafb',
                  color:
                    selectedMarket.annualAppreciation > 5
                      ? 'var(--green)'
                      : selectedMarket.annualAppreciation > 4
                      ? '#92400e'
                      : 'var(--muted)',
                  border: `1px solid ${
                    selectedMarket.annualAppreciation > 5
                      ? '#bbf7d0'
                      : selectedMarket.annualAppreciation > 4
                      ? '#fde68a'
                      : 'var(--border)'
                  }`,
                }}
              >
                {selectedMarket.annualAppreciation > 5
                  ? 'Strong'
                  : selectedMarket.annualAppreciation > 4
                  ? 'Good'
                  : 'Steady'}
              </div>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                ['Annual Appreciation', `+${selectedMarket.annualAppreciation}%`],
                ['Median Home', fmt(selectedMarket.medianHome)],
                ['Rent Yield', `${selectedMarket.rentYield}%`],
                ['Est. Monthly Rent', fmt(monthlyRentEstimate)],
                ['Projected Value (5yr)', fmt(value5yr)],
                ['Projected Value (10yr)', fmt(value10yr)],
              ].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid var(--border)', padding: '12px 14px', borderRadius: '2px' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                    {label}
                  </div>
                  <div className="font-display text-2xl" style={{ color: label === 'Annual Appreciation' ? 'var(--green)' : 'var(--ink)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="overflow-x-auto mb-12">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
              <thead>
                <tr style={{ background: 'var(--ink)', color: 'var(--gold)' }}>
                  {['Market', 'Region', 'Annual Appreciation', 'Median Home', 'Rent Yield', 'Rating'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-mono uppercase tracking-wider"
                      style={{ padding: '12px 16px', borderRight: '1px solid #333' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {markets.map((m, i) => {
                  const active = selectedMarket.city === m.city;
                  return (
                    <tr
                      key={m.city}
                      onClick={() => setSelectedCity(m.city)}
                      style={{
                        background: active ? '#fff7ed' : i % 2 === 0 ? 'white' : 'var(--cream)',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCity(m.city)}
                          className="hover:underline"
                          style={{ textAlign: 'left', color: 'inherit', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          {m.city}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{m.region}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--green)', fontWeight: 'bold', fontFamily: 'Georgia, serif', fontSize: 18 }}>
                        +{m.annualAppreciation}%
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{fmt(m.medianHome)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{m.rentYield}%</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '2px',
                            background: m.annualAppreciation > 5 ? '#f0fdf4' : m.annualAppreciation > 4 ? '#fefce8' : '#f9fafb',
                            color: m.annualAppreciation > 5 ? 'var(--green)' : m.annualAppreciation > 4 ? '#92400e' : 'var(--muted)',
                            border: `1px solid ${m.annualAppreciation > 5 ? '#bbf7d0' : m.annualAppreciation > 4 ? '#fde68a' : 'var(--border)'}`,
                          }}
                        >
                          {m.annualAppreciation > 5 ? 'Strong' : m.annualAppreciation > 4 ? 'Good' : 'Steady'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Index Funds */}
          <div className="mb-8">
            <div className="rule-thick mb-1" />
            <div className="rule-thin mb-6" />
            <h2 className="text-3xl font-display font-bold mb-2">Index Fund Snapshot</h2>
            <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
              Major index ETFs · Expense ratios · Historical performance data
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {INDEX_FUNDS.map((f) => (
                <div key={f.ticker} style={{ border: '1px solid var(--border)', padding: '20px 24px', borderRadius: '2px', background: 'white' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono font-bold text-2xl" style={{ color: 'var(--ink)' }}>{f.ticker}</span>
                      <span className="ml-3 text-sm" style={{ color: 'var(--muted)' }}>{f.index}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        background: '#f9fafb',
                        color: RISK_COLOR[f.risk] || 'var(--muted)',
                        border: `1px solid ${(RISK_COLOR[f.risk] || '#6b6560')}33`,
                      }}
                    >
                      {f.risk}
                    </span>
                  </div>
                  <div className="text-sm mb-3" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {f.description}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ['1yr', f.historicReturn1yr],
                      ['5yr', f.historicReturn5yr],
                      ['10yr', f.historicReturn10yr],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: 'var(--cream)', padding: '10px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>
                        <div style={{ color: val > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 'bold', fontFamily: 'Georgia, serif', fontSize: 18 }}>
                          {val > 0 ? '+' : ''}{val}%
                        </div>
                        <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{label}</div>
                      </div>
                    ))}
                    <div style={{ background: 'var(--cream)', padding: '10px 6px', borderRadius: '2px', border: '1px solid var(--border)' }}>
                      <div style={{ color: 'var(--ink)', fontWeight: 'bold', fontFamily: 'Georgia, serif', fontSize: 18 }}>
                        {f.expenseRatio}%
                      </div>
                      <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>expense</div>
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
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
