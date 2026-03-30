import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/Header';
import SiteFooter from '../../../components/SiteFooter';

const pages = [
  { href: '/decisions/wealth/invest-vs-debt', label: 'Invest vs Pay Off Debt' },
  { href: '/decisions/wealth/retirement', label: 'Retirement Projection' },
  { href: '/decisions/wealth/lump-sum-vs-dca', label: 'Lump Sum vs SIP (DCA)' },
  { href: '/calculators/net-worth', label: 'Net Worth Calculator' },
];

export default function WealthDecisionsPage() {
  const title = 'Wealth Decision Calculators | Figure My Money';
  const description = 'Compare investing, debt payoff, retirement, and contribution strategies with data-backed calculators.';

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
        <h1 className="text-4xl font-display font-bold mb-2">Wealth Decisions</h1>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Compare growth, debt reduction, and retirement strategy outcomes.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Link key={page.href} href={page.href}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px', height: '100%' }}>
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
