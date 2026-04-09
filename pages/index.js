import Head from 'next/head';
import Link from 'next/link';
import { getLiveRates } from '../lib/marketData';
import Header from '../components/Header';
import TickerBar from '../components/TickerBar';
import ContentTrustSection from '../components/ContentTrustSection';
import SiteFooter from '../components/SiteFooter';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

const heroMetrics = [
  { value: '15+', label: 'city-wise housing markets' },
  { value: '8', label: 'index fund snapshots' },
  { value: '7+', label: 'scenario-driven calculators' },
  { value: 'FRED', label: 'live macro inputs' },
];

const categories = [
  {
    title: 'Housing Decisions',
    description: 'Compare rent vs buy, mortgage payoff vs investing, and purchase scenarios with city-level appreciation context.',
    href: '/decisions/housing',
    cta: 'Explore housing',
  },
  {
    title: 'Lifestyle Decisions',
    description: 'Pressure-test the day-to-day choices that shape cash flow, flexibility, and long-term net worth.',
    href: '/decisions/lifestyle',
    cta: 'Explore lifestyle',
  },
  {
    title: 'Wealth Decisions',
    description: 'Model retirement readiness, investing vs debt payoff, and accumulation strategies with clearer trade-offs.',
    href: '/decisions/wealth',
    cta: 'Explore wealth',
  },
];

const platformPillars = [
  {
    title: 'Market-aware by default',
    description: 'Mortgage, Fed, prime, SOFR, and city-level appreciation data keep every decision grounded in the environment you are actually in.',
  },
  {
    title: 'From question to action',
    description: 'Start with a scenario, inspect the trade-offs, and move into a next step instead of stopping at a generic calculator output.',
  },
  {
    title: 'Recommendations stay transparent',
    description: 'Affiliate links and tool suggestions remain visible and clearly labeled so monetization never hides the reasoning.',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Pick the decision you are facing',
    description: 'Choose the housing, lifestyle, or wealth scenario that actually matches the trade-off in front of you.',
  },
  {
    step: '02',
    title: 'Model your real inputs',
    description: 'Use live rates, city-level assumptions, and your numbers instead of one-size-fits-all templates.',
  },
  {
    step: '03',
    title: 'Move into the right next step',
    description: 'Get a cleaner answer, explore the market context, and review relevant tools or offers if they help.',
  },
];

const featuredRoutes = [
  {
    title: 'City-wise markets dashboard',
    description: 'Inspect appreciation, rent yield, projected home values, and region-level context across tracked U.S. markets.',
    href: '/markets',
    cta: 'Open market intelligence',
  },
  {
    title: 'Decision engine',
    description: 'Go deeper on rent vs buy, invest vs debt, childcare trade-offs, retirement readiness, and more.',
    href: '/decisions',
    cta: 'Launch decision engine',
  },
  {
    title: 'Calculator library',
    description: 'Use quick calculators when you need a fast estimate, then move into full scenario comparisons when needed.',
    href: '/calculators',
    cta: 'Browse calculators',
  },
];

export default function HomePage({ rates }) {
  return (
    <>
      <Head>
        <title>Figure My Money | Premium Financial Decision Intelligence</title>
        <meta
          name="description"
          content="Compare rent vs buy, investing vs debt, retirement paths, and city-wise housing markets with live-rate context and scenario-first tools."
        />
        <meta property="og:title" content="Figure My Money | Premium Financial Decision Intelligence" />
        <meta
          property="og:description"
          content="Compare real financial decisions using city-level market data, live rates, and clear scenario modeling."
        />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        <TickerBar rates={rates} />

        <main>
          <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 md:pt-16 md:pb-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:items-stretch">
              <div className="surface-panel p-8 md:p-12">
                <div className="eyebrow mb-4">Smarter money decisions, styled like a modern command center</div>
                <h1 className="section-heading font-display font-semibold mb-5 max-w-4xl">
                  Figure out the best move before the money leaves your account.
                </h1>
                <p className="max-w-3xl text-base md:text-lg mb-8" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
                  Figure My Money helps you compare high-stakes choices with live-rate context, city-wise real estate data,
                  practical calculators, and transparent tool recommendations that stay easy to audit.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <Link href="/decisions" className="glass-button">
                    Start comparing
                  </Link>
                  <Link href="/markets" className="ghost-button">
                    Explore city-wise markets
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 mb-10">
                  <span className="stat-chip">Housing</span>
                  <span className="stat-chip">Lifestyle</span>
                  <span className="stat-chip">Wealth</span>
                  <span className="stat-chip">Live rates</span>
                  <span className="stat-chip">Affiliate-ready next steps</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {heroMetrics.map((metric) => (
                    <div key={metric.label} className="surface-muted p-5">
                      <div className="text-3xl md:text-4xl font-display font-semibold mb-2">{metric.value}</div>
                      <div className="eyebrow" style={{ color: 'var(--muted)' }}>
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="surface-card p-6 md:p-7 flex flex-col gap-5">
                <div>
                  <div className="eyebrow mb-3">What you can do right now</div>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-3" style={{ lineHeight: 1.15 }}>
                    Turn a vague money question into a next move.
                  </h2>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
                    Start broad with the market view, go narrow with a scenario calculator, then review relevant products or tools only if they help.
                  </p>
                </div>

                <div className="surface-muted p-5">
                  <div className="eyebrow mb-3">Coverage</div>
                  <ul className="info-list space-y-3 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                    <li>Real estate markets broken down by tracked city</li>
                    <li>Index fund snapshots for quick benchmark context</li>
                    <li>Decision calculators spanning housing, lifestyle, and wealth</li>
                    <li>Transparent affiliate pathways that stay clearly disclosed</li>
                  </ul>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {featuredRoutes.slice(0, 2).map((route) => (
                    <Link key={route.href} href={route.href} className="surface-muted p-5 block">
                      <div className="eyebrow mb-2">Featured route</div>
                      <div className="text-xl font-display font-semibold mb-2">{route.title}</div>
                      <p className="text-sm mb-3" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                        {route.description}
                      </p>
                      <span className="link-arrow">{route.cta}</span>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div className="max-w-3xl">
                <div className="eyebrow mb-3">Decision categories</div>
                <h2 className="text-3xl md:text-5xl font-display font-semibold mb-3" style={{ lineHeight: 1.05 }}>
                  Explore the major decisions that shape your balance sheet.
                </h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                  Every route is built around a question people actually ask, not a generic finance topic page.
                </p>
              </div>
              <Link href="/decisions" className="link-arrow">
                View all decision tools
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {categories.map((category) => (
                <Link key={category.href} href={category.href} className="surface-card p-6 md:p-7 block">
                  <div className="eyebrow mb-3">Category</div>
                  <h3 className="text-2xl md:text-3xl font-display font-semibold mb-3">{category.title}</h3>
                  <p className="mb-6" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                    {category.description}
                  </p>
                  <span className="link-arrow">{category.cta}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="surface-card p-8 md:p-10">
              <div className="grid gap-5 lg:grid-cols-3">
                {platformPillars.map((pillar) => (
                  <div key={pillar.title} className="surface-muted p-5 md:p-6">
                    <div className="eyebrow mb-3">Platform layer</div>
                    <h3 className="text-2xl font-display font-semibold mb-3">{pillar.title}</h3>
                    <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div className="max-w-2xl">
                <div className="eyebrow mb-3">How it works</div>
                <h2 className="text-3xl md:text-5xl font-display font-semibold" style={{ lineHeight: 1.05 }}>
                  The flow is simple. The output is sharper.
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {workflow.map((item) => (
                <div key={item.step} className="surface-card p-6 md:p-7">
                  <div className="eyebrow mb-4">Step {item.step}</div>
                  <h3 className="text-2xl font-display font-semibold mb-3">{item.title}</h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="grid gap-4 md:grid-cols-3">
              {featuredRoutes.map((route) => (
                <Link key={route.href} href={route.href} className="surface-card p-6 md:p-7 block">
                  <div className="eyebrow mb-3">Featured destination</div>
                  <h3 className="text-2xl md:text-3xl font-display font-semibold mb-3">{route.title}</h3>
                  <p className="mb-6" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                    {route.description}
                  </p>
                  <span className="link-arrow">{route.cta}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-8">
            <div className="surface-panel p-8 md:p-10 lg:p-12">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
                <div>
                  <div className="eyebrow mb-3">Positioning</div>
                  <h2 className="text-3xl md:text-5xl font-display font-semibold mb-4" style={{ lineHeight: 1.05 }}>
                    Not product hype. Just cleaner financial decisions.
                  </h2>
                  <p className="max-w-3xl mb-6" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
                    We keep the market context, the city-wise housing data, and the affiliate pathways — but the goal stays the same:
                    help you compare the options clearly before you commit.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/markets" className="glass-button">
                      See market data
                    </Link>
                    <Link href="/calculators" className="ghost-button">
                      Open calculator hub
                    </Link>
                  </div>
                </div>

                <div className="surface-muted p-5 md:p-6">
                  <div className="eyebrow mb-3">Why this matters</div>
                  <ul className="info-list space-y-3 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
                    <li>Know whether the market backdrop changes the answer</li>
                    <li>Understand where an affiliate offer fits — if it fits at all</li>
                    <li>Move from browsing to an actual, defensible next step</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </main>

        <ContentTrustSection />
        <SiteFooter />
      </div>
    </>
  );
}
