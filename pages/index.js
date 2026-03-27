// pages/index.js
import Head from 'next/head';
import { getLiveRates } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';
import Link from 'next/link';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

const categories = [
  {
    title: 'Housing Decisions',
    description: 'Rent vs buy, mortgage vs investing, and real estate comparisons',
    cta: 'Explore Housing',
    href: '/decisions/housing',
  },
  {
    title: 'Lifestyle Decisions',
    description: 'Daily financial choices like car buying and childcare costs',
    cta: 'Explore Lifestyle',
    href: '/decisions/lifestyle',
  },
  {
    title: 'Wealth Decisions',
    description: 'Grow your wealth with smarter investing and debt strategies',
    cta: 'Explore Wealth',
    href: '/decisions/wealth',
  },
];

const popularCalculators = [
  { title: 'Rent vs Buy', href: '/decisions/housing/rent-vs-buy' },
  { title: 'Invest vs Pay Off Debt', href: '/decisions/wealth/invest-vs-debt' },
  { title: 'Retirement Projection', href: '/decisions/wealth/retirement' },
];

export default function HomePage({ rates }) {
  return (
    <>
      <Head>
        <title>Figure My Money | Compare Financial Decisions with Data</title>
        <meta
          name="description"
          content="Compare rent vs buy, investing vs debt, and more. Make smarter financial decisions using real data and projections."
        />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        <TickerBar rates={rates} />

        {/* Hero */}
        <section style={{ borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
          <div className="max-w-7xl mx-auto px-6 py-14">
            <div className="rule-thick mb-1" />
            <div className="rule-thin mb-8" />

            <div className="max-w-4xl">
              <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--gold)' }}>
                Make smarter money decisions with data
              </div>

              <h1 className="text-5xl md:text-6xl font-display font-bold mb-5" style={{ lineHeight: 1.05 }}>
                Figure your money before you decide
              </h1>

              <p className="mb-8" style={{ color: 'var(--muted)', lineHeight: 1.8, maxWidth: '760px' }}>
                Compare real-life financial decisions — from buying a home to paying off debt — using real data and projections.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/decisions">
                  <button
                    style={{
                      background: 'var(--ink)',
                      color: 'var(--gold)',
                      padding: '14px 32px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '2px',
                    }}
                  >
                    Start Exploring
                  </button>
                </Link>

                <Link href="/decisions">
                  <button
                    style={{
                      background: 'white',
                      color: 'var(--ink)',
                      padding: '14px 32px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      borderRadius: '2px',
                    }}
                  >
                    View All Calculators
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-6" />

          <h2 className="text-3xl font-display font-bold mb-6">Explore by Decision Category</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link key={category.href} href={category.href}>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '22px' }}>
                  <div className="font-display font-bold text-2xl mb-3">{category.title}</div>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7 }} className="mb-4">
                    {category.description}
                  </p>
                  <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                    {category.cta} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h2 className="text-3xl font-display font-bold mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Pick a decision' },
                { step: '2', title: 'Enter your numbers' },
                { step: '3', title: 'Get a data-backed recommendation' },
              ].map((item) => (
                <div key={item.step} style={{ border: '1px solid var(--border)', borderRadius: '2px', padding: '18px 20px' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
                    Step {item.step}
                  </div>
                  <div className="font-display font-bold text-2xl">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Optional: Popular calculators */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-display font-bold mb-6">Popular Calculators</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {popularCalculators.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '18px 20px' }}>
                  <div className="font-display font-bold text-2xl mb-2">{tool.title}</div>
                  <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                    Open calculator →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust / Positioning */}
        <section style={{ background: 'var(--ink)', color: 'var(--paper)' }} className="py-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-display font-bold mb-3" style={{ color: 'var(--gold)' }}>
              Not advice. Just better decisions.
            </h2>
            <p style={{ color: 'rgba(245, 240, 232, 0.8)', lineHeight: 1.8 }}>
              We don’t sell products. We help you compare them objectively using data.
            </p>
          </div>
        </section>

        <footer style={{ borderTop: '3px solid var(--ink)', background: 'var(--cream)' }} className="py-6">
          <div
            className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs font-mono"
            style={{ color: 'var(--muted)' }}
          >
            <div>© 2026 Figure My Money · Not financial advice. For informational purposes only.</div>
            <div>Data sources: FRED/Federal Reserve · Market data may be delayed</div>
          </div>
        </footer>
      </div>
    </>
  );
}
