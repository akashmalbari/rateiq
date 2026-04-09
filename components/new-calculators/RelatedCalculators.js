import Link from 'next/link';
import { getCalculatorConfig } from '../../data/calculators';

export default function RelatedCalculators({ slugs }) {
  const items = slugs.map((slug) => getCalculatorConfig(slug)).filter(Boolean);

  return (
    <section className="mt-14 mb-4">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <div>
          <div className="eyebrow mb-3">Keep exploring</div>
          <h2 className="text-3xl md:text-4xl font-display font-semibold">Related calculators</h2>
        </div>
        <Link href="/calculators" className="link-arrow">
          View all tools
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link key={item.slug} href={`/calculators/${item.slug}`} className="surface-card p-5 md:p-6 block">
            <div className="eyebrow mb-3">{item.eyebrow}</div>
            <h3 className="text-xl md:text-2xl font-display font-semibold mb-3">{item.title}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{item.cardDescription}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
