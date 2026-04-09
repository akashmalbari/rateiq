import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';

const calculatorGroups = [
  {
    category: 'Housing Decisions',
    href: '/decisions/housing',
    description: 'Rent vs buy, mortgage payoff vs investing, and real estate decision flows with market-aware context.',
    calculators: [
      {
        title: 'Rent vs Buy',
        href: '/decisions/housing/rent-vs-buy',
        description: 'Compare long-term cost and net-worth impact of renting versus buying a home.',
      },
      {
        title: 'Mortgage vs Invest',
        href: '/decisions/housing/mortgage-vs-invest',
        description: 'See whether extra cash is better used to pay down your mortgage or invest.',
      },
    ],
  },
  {
    category: 'Lifestyle Decisions',
    href: '/decisions/lifestyle',
    description: 'Evaluate the everyday choices that can quietly compound into major long-term outcomes.',
    calculators: [
      {
        title: 'Car Lease vs Buy',
        href: '/decisions/lifestyle/car-lease-vs-buy',
        description: 'Estimate total ownership cost across lease and financing options.',
      },
      {
        title: 'Childcare vs Stay Home',
        href: '/decisions/lifestyle/childcare-vs-stay-home',
        description: 'Measure income trade-offs between paying for childcare and leaving work.',
      },
    ],
  },
  {
    category: 'Wealth Decisions',
    href: '/decisions/wealth',
    description: 'Compare investing, debt payoff, retirement planning, and deployment strategies with clearer trade-offs.',
    calculators: [
      {
        title: 'Invest vs Pay Off Debt',
        href: '/decisions/wealth/invest-vs-debt',
        description: 'Compare expected investment return to debt payoff savings.',
      },
      {
        title: 'Retirement Projection',
        href: '/decisions/wealth/retirement',
        description: 'Project retirement savings growth and readiness over time.',
      },
      {
        title: 'Lump Sum vs DCA',
        href: '/decisions/wealth/lump-sum-vs-dca',
        description: 'Evaluate investing immediately versus spreading contributions over time.',
      },
    ],
  },
];

export default function DecisionsHomePage() {
  const title = 'All Financial Calculators | Figure My Money';
  const description = 'Explore all Figure My Money calculators across housing, lifestyle, and wealth decisions.';

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

        <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <section className="surface-panel p-8 md:p-10 mb-10">
            <div className="max-w-4xl">
              <div className="eyebrow mb-4">Decision engine</div>
              <h1 className="text-4xl md:text-6xl font-display font-semibold mb-4" style={{ lineHeight: 1.02, letterSpacing: '-0.04em' }}>
                Pick the decision. Model the trade-offs. Move with more conviction.
              </h1>
              <p className="text-base md:text-lg mb-8" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
                These calculators are organized around the real choices people face across housing, lifestyle, and wealth — not just isolated formulas.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/markets" className="ghost-button">
                  Open city-wise markets
                </Link>
                <Link href="/calculators" className="glass-button">
                  Browse calculator hub
                </Link>
              </div>
            </div>
          </section>

          <div className="space-y-8">
            {calculatorGroups.map((group) => (
              <section key={group.category} className="surface-card p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                  <div className="max-w-3xl">
                    <div className="eyebrow mb-3">Category</div>
                    <h2 className="text-3xl md:text-4xl font-display font-semibold mb-3">{group.category}</h2>
                    <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{group.description}</p>
                  </div>
                  <Link href={group.href} className="link-arrow">
                    View category
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.calculators.map((calculator) => (
                    <Link key={calculator.href} href={calculator.href} className="surface-muted p-5 md:p-6 block">
                      <div className="eyebrow mb-3">Calculator</div>
                      <div className="text-2xl font-display font-semibold mb-3">{calculator.title}</div>
                      <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{calculator.description}</p>
                      <div className="mt-5">
                        <span className="link-arrow">Open calculator</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
