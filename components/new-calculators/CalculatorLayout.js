import Link from 'next/link';

export default function CalculatorLayout({
  eyebrow,
  title,
  description,
  form,
  results,
  related,
}) {
  const relatedHref = related?.[0] ? `/calculators/${related[0]}` : '/calculators';

  return (
    <main>
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 md:pt-14 md:pb-10">
        <div className="surface-panel p-8 md:p-10 lg:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="eyebrow mb-3">{eyebrow}</div>
              <h1 className="text-4xl md:text-6xl font-display font-semibold mb-4" style={{ lineHeight: 1.02, letterSpacing: '-0.04em' }}>
                {title}
              </h1>
              <p className="max-w-2xl text-base md:text-lg" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-mono uppercase tracking-wide">
              <Link href="/calculators" className="ghost-button">
                All calculators
              </Link>
              <Link href={relatedHref} className="glass-button">
                Related tool
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12 md:pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_390px] lg:items-start">
          <div>{form}</div>
          <aside className="lg:sticky lg:top-28">{results}</aside>
        </div>
      </section>
    </main>
  );
}
