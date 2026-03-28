import Link from 'next/link';

export default function CalculatorLayout({
  eyebrow,
  title,
  description,
  form,
  results,
  related,
}) {
  return (
    <main>
      <section style={{ borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div
                className="text-xs font-mono uppercase tracking-widest mb-3"
                style={{ color: 'var(--gold)' }}
              >
                {eyebrow}
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{title}</h1>
              <p className="max-w-2xl text-base md:text-lg" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-mono uppercase tracking-wide">
              <Link
                href="/calculators"
                className="px-4 py-3 border rounded-sm"
                style={{ borderColor: 'var(--border)', background: 'white' }}
              >
                All Calculators
              </Link>
              <Link
                href={`/calculators/${related[0]}`}
                className="px-4 py-3 border rounded-sm"
                style={{ borderColor: 'var(--border)', background: 'white' }}
              >
                Related Tool
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_380px] lg:items-start">
          <div>{form}</div>
          <aside className="lg:sticky lg:top-24">{results}</aside>
        </div>
      </section>
    </main>
  );
}
