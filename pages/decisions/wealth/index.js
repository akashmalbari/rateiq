import Link from 'next/link';
import Header from '../../../components/Header';

const pages = [
  { href: '/decisions/wealth/invest-vs-debt', label: 'Invest vs Pay Off Debt' },
  { href: '/decisions/wealth/retirement', label: 'Retirement Projection' },
  { href: '/decisions/wealth/lump-sum-vs-dca', label: 'Lump Sum vs SIP (DCA)' },
];

export default function WealthDecisionsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-10">
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
      </div>
    </div>
  );
}
