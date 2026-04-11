import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getLiveRates, REAL_ESTATE_MARKETS, INDEX_FUNDS } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';
import SiteFooter from '../components/SiteFooter';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function projectedValue(base, annualPct, years) {
  return Math.round(base * Math.pow(1 + annualPct / 100, years));
}

function getStrength(appreciation) {
  if (appreciation >= 5.5) {
    return {
      label: 'High momentum',
      background: 'rgba(88, 224, 172, 0.12)',
      color: 'var(--green)',
      border: 'rgba(88, 224, 172, 0.3)',
    };
  }

  if (appreciation >= 4.5) {
    return {
      label: 'Balanced growth',
      background: 'rgba(88, 183, 255, 0.12)',
      color: 'var(--gold-light)',
      border: 'rgba(88, 183, 255, 0.28)',
    };
  }

  return {
    label: 'Steady market',
    background: 'rgba(147, 168, 199, 0.12)',
    color: 'var(--muted)',
    border: 'rgba(138, 171, 214, 0.2)',
  };
}

const RISK_COLOR = {
  Low: '#58e0ac',
  Moderate: '#8dd2ff',
  'Moderate-High': '#ff8fb0',
  High: '#ff6b8a',
};

export default function MarketsPage({ rates }) {
  const title = 'Markets Dashboard | Figure My Money';
  const description = 'Track real estate market snapshots and index fund data for better financial comparisons.';

  const markets = useMemo(
    () => [...REAL_ESTATE_MARKETS].sort((a, b) => a.city.localeCompare(b.city)),
    []
  );

  const [selectedCity, setSelectedCity] = useState('Miami, FL');
  const selectedMarket = markets.find((market) => market.city === selectedCity) || markets[0];
  const quickSelectMarkets = markets.slice(0, 6);

  const monthlyRentEstimate = Math.round((selectedMarket.medianHome * (selectedMarket.rentYield / 100)) / 12);
  const value5yr = projectedValue(selectedMarket.medianHome, selectedMarket.annualAppreciation, 5);
  const value10yr = projectedValue(selectedMarket.medianHome, selectedMarket.annualAppreciation, 10);
  const strength = getStrength(selectedMarket.annualAppreciation);

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

        <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px] mb-10">
            <div className="surface-panel p-8 md:p-10">
              <div className="eyebrow mb-4">City-wise market intelligence</div>
              <h1 className="text-4xl md:text-6xl font-display font-semibold mb-4" style={{ lineHeight: 1.02, letterSpacing: '-0.04em' }}>
                Track the housing backdrop before you compare the decision.
              </h1>
              <p className="max-w-3xl text-base md:text-lg mb-8" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
                Review appreciation, rent yield, and projected values across tracked real estate markets, then move into the decision engine with sharper assumptions.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                <span className="stat-chip">{markets.length} tracked cities</span>
                <span className="stat-chip">Projected 5yr / 10yr values</span>
                <span className="stat-chip">Index fund benchmark view</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/decisions/housing" className="glass-button">
                  Run housing decisions
                </Link>
                <Link href="/calculators" className="ghost-button">
                  Open calculators
                </Link>
              </div>
            </div>

            <aside className="surface-card p-6 md:p-7 flex flex-col gap-4">
              <div>
                <div className="eyebrow mb-3">Selected market</div>
                <h2 className="text-3xl font-display font-semibold mb-1">{selectedMarket.city}</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                  {selectedMarket.region} region · updated with annual market assumptions
                </p>
                <span
                  className="badge-live"
                  style={{
                    background: strength.background,
                    color: strength.color,
                    borderColor: strength.border,
                  }}
                >
                  {strength.label}
                </span>
              </div>

              <div className="surface-muted p-5">
                <div className="eyebrow mb-3">What this helps with</div>
                <ul className="info-list space-y-3 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                  <li>See whether local appreciation changes rent vs buy math</li>
                  <li>Estimate future value ranges before modeling ownership</li>
                  <li>Pair housing context with investing benchmarks and live rates</li>
                </ul>
              </div>
            </aside>
          </section>

          <section className="surface-card p-6 md:p-8 mb-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-6">
              <div>
                <div className="eyebrow mb-3">Market detail</div>
                <h2 className="text-3xl md:text-4xl font-display font-semibold mb-2">{selectedMarket.city}</h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
                  Click any city below to refresh the market detail panel and carry better assumptions into your housing comparisons.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickSelectMarkets.map((market) => {
                  const active = market.city === selectedMarket.city;
                  return (
                    <button
                      key={market.city}
                      type="button"
                      onClick={() => setSelectedCity(market.city)}
                      className={active ? 'glass-button' : 'ghost-button'}
                    >
                      {market.city}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {[
                ['Annual appreciation', `+${selectedMarket.annualAppreciation}%`, 'var(--green)'],
                ['Median home', fmt(selectedMarket.medianHome), 'var(--ink)'],
                ['Rent yield', `${selectedMarket.rentYield}%`, 'var(--gold-light)'],
                ['Est. monthly rent', fmt(monthlyRentEstimate), 'var(--ink)'],
                ['Projected value (5yr)', fmt(value5yr), 'var(--gold-light)'],
                ['Projected value (10yr)', fmt(value10yr), 'var(--gold-light)'],
              ].map(([label, value, color]) => (
                <div key={label} className="surface-muted p-5">
                  <div className="eyebrow mb-2" style={{ color: 'var(--muted)' }}>
                    {label}
                  </div>
                  <div className="text-2xl md:text-3xl font-display font-semibold" style={{ color }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
              <div>
                <div className="eyebrow mb-3">All tracked markets</div>
                <h2 className="text-3xl md:text-4xl font-display font-semibold">Compare city-by-city performance</h2>
              </div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Source context: Zillow Research / FHFA / public market datasets
              </div>
            </div>

            <div className="table-shell overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    {['Market', 'Region', 'Annual appreciation', 'Median home', 'Rent yield', 'Rating'].map((heading) => (
                      <th key={heading}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {markets.map((market, index) => {
                    const active = selectedMarket.city === market.city;
                    const marketStrength = getStrength(market.annualAppreciation);
                    return (
                      <tr
                        key={market.city}
                        onClick={() => setSelectedCity(market.city)}
                        style={{
                          cursor: 'pointer',
                          background: active
                            ? 'rgba(88, 183, 255, 0.08)'
                            : index % 2 === 0
                            ? 'transparent'
                            : 'rgba(255,255,255,0.01)',
                        }}
                      >
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedCity(market.city)}
                            style={{
                              textAlign: 'left',
                              color: 'var(--ink)',
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {market.city}
                          </button>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{market.region}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 700 }}>+{market.annualAppreciation}%</td>
                        <td>{fmt(market.medianHome)}</td>
                        <td>{market.rentYield}%</td>
                        <td>
                          <span
                            className="badge-live"
                            style={{
                              background: marketStrength.background,
                              color: marketStrength.color,
                              borderColor: marketStrength.border,
                            }}
                          >
                            {marketStrength.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <div className="eyebrow mb-3">Index fund benchmark view</div>
                <h2 className="text-3xl md:text-4xl font-display font-semibold">Context for the invest side of the trade-off</h2>
              </div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Trailing returns and expense ratios for major index ETFs
              </div>
            </div>

            <div style={{ maxHeight: 780, overflowY: 'auto', paddingRight: 4 }}>
              <div className="grid gap-4 md:grid-cols-2">
                {INDEX_FUNDS.map((fund) => (
                  <div key={fund.ticker} className="surface-card p-6 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="eyebrow mb-2">{fund.index}</div>
                        <div className="text-3xl font-display font-semibold mb-1">{fund.ticker}</div>
                        <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                          {fund.description}
                        </p>
                      </div>
                      <span
                        className="badge-live"
                        style={{
                          background: `${RISK_COLOR[fund.risk] || '#93a8c7'}18`,
                          color: RISK_COLOR[fund.risk] || 'var(--muted)',
                          borderColor: `${RISK_COLOR[fund.risk] || '#93a8c7'}55`,
                        }}
                      >
                        {fund.risk}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ['1yr', fund.historicReturn1yr],
                        ['5yr', fund.historicReturn5yr],
                        ['10yr', fund.historicReturn10yr],
                        ['Expense', fund.expenseRatio],
                      ].map(([label, value]) => {
                        const isExpense = label === 'Expense';
                        return (
                          <div key={label} className="surface-muted p-4 text-center">
                            <div
                              className="text-xl md:text-2xl font-display font-semibold mb-1"
                              style={{
                                color: isExpense ? 'var(--ink)' : value > 0 ? 'var(--green)' : 'var(--red)',
                              }}
                            >
                              {isExpense ? `${value}%` : `${value > 0 ? '+' : ''}${value}%`}
                            </div>
                            <div className="eyebrow" style={{ color: 'var(--muted)' }}>
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <p className="text-xs text-center" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
            All data is for informational purposes only. Past performance does not guarantee future results.
            Real estate appreciation rates are historical averages, and index fund figures are trailing snapshots net of expense ratios.
          </p>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
