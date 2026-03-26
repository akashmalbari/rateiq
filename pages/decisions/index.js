import Link from 'next/link';
import Header from '../../components/Header';

const categories = [
  {
    title: 'Housing Decisions',
    href: '/decisions/housing',
    description: 'Rent vs buy, mortgage optimization, and home affordability tradeoffs.',
  },
  {
    title: 'Lifestyle Decisions',
    href: '/decisions/lifestyle',
    description: 'Major day-to-day financial decisions such as transportation and childcare.',
  },
  {
    title: 'Wealth Decisions',
    href: '/decisions/wealth',
    description: 'Debt payoff, investing strategy, and retirement planning scenarios.',
  },
];

export default function DecisionsHomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="rule-thick mb-1" />
        <div className="rule-thin mb-8" />
        <h1 className="text-4xl font-display font-bold mb-2">Finance Decision Engine</h1>
        <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Choose a category and run data-driven financial comparisons.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link key={category.href} href={category.href}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px', height: '100%' }}>
                <div className="font-display font-bold text-2xl mb-2">{category.title}</div>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{category.description}</p>
                <div className="mt-4 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                  Explore →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
