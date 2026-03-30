import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/Header';
import SiteFooter from '../../../components/SiteFooter';

const pages = [
  { href: '/decisions/lifestyle/car-lease-vs-buy', label: 'Car Lease vs Buy' },
  { href: '/decisions/lifestyle/childcare-vs-stay-home', label: 'Childcare vs Stay-at-Home' },
  { href: '/calculators/cost-of-living', label: 'Cost of Living Calculator' },
  { href: '/calculators/emergency-fund', label: 'Emergency Fund Calculator' },
];

export default function LifestyleDecisionsPage() {
  const title = 'Lifestyle Decision Calculators | Figure My Money';
  const description = 'Evaluate everyday financial decisions like car lease vs buy and childcare tradeoffs.';

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
        <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="rule-thick mb-1" />
        <div className="rule-thin mb-8" />
        <h1 className="text-4xl font-display font-bold mb-2">Lifestyle Decisions</h1>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Evaluate major day-to-day choices with financial clarity.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {pages.map((page) => (
            <Link key={page.href} href={page.href}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px' }}>
                <div className="font-display font-bold text-2xl">{page.label}</div>
                <div className="mt-3 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                  Open calculator →
                </div>
              </div>
            </Link>
          ))}
        </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
