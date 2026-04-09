import Link from 'next/link';

export default function AffiliateCTA() {
  return (
    <div className="surface-muted p-5 md:p-6">
      <div className="eyebrow mb-3">Next step</div>
      <h3 className="text-xl md:text-2xl font-display font-semibold mb-3">
        Compare your options with live market context.
      </h3>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
        Move from a calculator result into city-wise rates, market context, and the broader decision engine without losing the thread.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/markets" className="glass-button">
          Check rates
        </Link>
        <Link href="/decisions" className="ghost-button">
          Compare options
        </Link>
      </div>
    </div>
  );
}
