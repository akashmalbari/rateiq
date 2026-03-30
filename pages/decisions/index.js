import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';

const calculatorGroups = [
  {
    category: 'Housing Decisions',
    href: '/decisions/housing',
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
        <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="rule-thick mb-1" />
        <div className="rule-thin mb-8" />
        <h1 className="text-4xl font-display font-bold mb-2">Finance Decision Engine</h1>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          All calculators in one place. Pick any tool below to start comparing scenarios.
        </p>

        <div className="space-y-8">
          {calculatorGroups.map((group) => (
            <section key={group.category}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-2xl">{group.category}</h2>
                <Link href={group.href} className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                  View category →
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {group.calculators.map((calculator) => (
                  <Link key={calculator.href} href={calculator.href}>
                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px', height: '100%' }}>
                      <div className="font-display font-bold text-2xl mb-2">{calculator.title}</div>
                      <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{calculator.description}</p>
                      <div className="mt-4 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                        Open calculator →
                      </div>
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
