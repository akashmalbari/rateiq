import Link from 'next/link';
import { getCalculatorConfig } from '../../data/calculators';

export default function RelatedCalculators({ slugs }) {
  const items = slugs.map((slug) => getCalculatorConfig(slug)).filter(Boolean);

  return (
    <section className="mt-14 mb-4">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h2 className="text-3xl font-display font-bold">Related Calculators</h2>
        <Link
          href="/calculators"
          className="text-xs font-mono uppercase tracking-wide underline"
          style={{ color: 'var(--muted)' }}
        >
          View all tools
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/calculators/${item.slug}`}
            className="block rounded-sm p-5"
            style={{ background: 'white', border: '1px solid var(--border)', textDecoration: 'none' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
              {item.eyebrow}
            </div>
            <h3 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--ink)' }}>
              {item.title}
            </h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{item.cardDescription}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
