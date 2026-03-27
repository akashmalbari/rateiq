import Link from 'next/link';
import Header from '../../../components/Header';

const pages = [
  { href: '/decisions/housing/rent-vs-buy', label: 'Rent vs Buy' },
  { href: '/calculator', label: 'Invest vs Real Estate' },
  { href: '/decisions/housing/mortgage-vs-invest', label: 'Mortgage vs Invest Extra Cash' },
];

export default function HousingDecisionsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="rule-thick mb-1" />
        <div className="rule-thin mb-8" />
        <h1 className="text-4xl font-display font-bold mb-2">Housing Decisions</h1>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Compare housing strategies with scenario-based financial outcomes.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
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

        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '2px', padding: '18px 20px' }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
            Housing Market Intelligence
          </div>
          <Link href="/markets" className="font-display font-bold text-2xl hover:underline" style={{ color: 'var(--ink)' }}>
            Mortgage & Market Rates
          </Link>
          <div className="mt-3 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
            Open market dashboard →
          </div>
        </div>
      </div>
    </div>
  );
}
