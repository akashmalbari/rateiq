import Link from 'next/link';
import { calculatorConfigs } from '../../data/calculators';

export default function CalculatorHub() {
  return (
    <main>
      <section style={{ borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />
          <div className="max-w-3xl">
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
              Calculator Library
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Financial calculators built for everyday decisions
            </h1>
            <p className="text-base md:text-lg" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
              Compare costs, measure net worth, pressure-test a car decision, and set an emergency fund target with tools that match the existing Figure My Money look and feel.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {calculatorConfigs.map((calculator) => (
            <Link
              key={calculator.slug}
              href={
                calculator.slug === 'car-lease-vs-buy'
                  ? '/decisions/lifestyle/car-lease-vs-buy'
                  : `/calculators/${calculator.slug}`
              }
              className="block rounded-sm p-5"
              style={{ background: 'white', border: '1px solid var(--border)', textDecoration: 'none' }}
            >
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
                {calculator.eyebrow}
              </div>
              <h2 className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--ink)' }}>
                {calculator.title}
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>{calculator.cardDescription}</p>
              <div className="mt-4 text-xs font-mono uppercase tracking-wide underline" style={{ color: 'var(--muted)' }}>
                {calculator.slug === 'car-lease-vs-buy' ? 'Open lifestyle calculator' : 'Open calculator'}
              </div>
            </Link>
          ))}
        </div>

        <div
          className="mt-10 rounded-sm p-6 md:p-8"
          style={{ background: 'var(--ink)', color: 'var(--paper)' }}
        >
          <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
            More Tools
          </div>
          <h2 className="text-3xl font-display font-bold mb-3" style={{ color: 'var(--gold)' }}>
            Explore the broader decision engine
          </h2>
          <p className="max-w-2xl mb-5" style={{ color: '#cbbfa9', lineHeight: 1.7 }}>
            The pulled update also added scenario-driven pages across housing, lifestyle, and wealth. Use the calculator library for quick estimates, then move into the decision engine for deeper side-by-side comparisons.
          </p>
          <Link
            href="/decisions"
            className="inline-flex items-center justify-center px-5 py-3 rounded-sm text-xs font-mono uppercase tracking-widest"
            style={{ background: 'var(--paper)', color: 'var(--ink)', textDecoration: 'none' }}
          >
            Open Decision Engine
          </Link>
        </div>
      </section>
    </main>
  );
}
