import Link from 'next/link';
import { calculatorConfigs } from '../../data/calculators';

export default function CalculatorHub() {
  return (
    <main>
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 md:pt-14 md:pb-10">
        <div className="surface-panel p-8 md:p-10 lg:p-12">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">Calculator library</div>
            <h1 className="text-4xl md:text-6xl font-display font-semibold mb-4" style={{ lineHeight: 1.02, letterSpacing: '-0.04em' }}>
              Practical calculators for the decisions that matter most.
            </h1>
            <p className="text-base md:text-lg mb-8" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
              Use quick estimates for cost of living, net worth, emergency fund planning, and car decisions — then move into deeper comparison flows when you need more confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/decisions" className="glass-button">
                Open decision engine
              </Link>
              <Link href="/markets" className="ghost-button">
                See market backdrop
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12 md:pb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {calculatorConfigs.map((calculator) => (
            <Link
              key={calculator.slug}
              href={
                calculator.slug === 'car-lease-vs-buy'
                  ? '/decisions/lifestyle/car-lease-vs-buy'
                  : `/calculators/${calculator.slug}`
              }
              className="surface-card p-6 block"
            >
              <div className="eyebrow mb-3">{calculator.eyebrow}</div>
              <h2 className="text-2xl font-display font-semibold mb-3">{calculator.title}</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{calculator.cardDescription}</p>
              <div className="mt-5">
                <span className="link-arrow">
                  {calculator.slug === 'car-lease-vs-buy' ? 'Open lifestyle calculator' : 'Open calculator'}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="surface-card mt-10 p-8 md:p-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
            <div>
              <div className="eyebrow mb-3">More than a formula</div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-3">Use quick estimates, then go deeper with full decision flows.</h2>
              <p className="max-w-2xl" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                The broader platform includes scenario-driven pages across housing, lifestyle, and wealth — plus city-wise markets and transparent product recommendations where useful.
              </p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Link href="/decisions" className="glass-button">
                Open decisions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
