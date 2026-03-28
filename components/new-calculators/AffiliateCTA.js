import Link from 'next/link';

export default function AffiliateCTA() {
  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: '2px',
    border: '1px solid var(--border)',
    fontSize: '12px',
    fontFamily: 'Courier New, monospace',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    textDecoration: 'none',
  };

  return (
    <div
      className="rounded-sm p-4"
      style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
        Next Step
      </div>
      <h3 className="text-xl font-display font-bold mb-2">Compare your options with live context</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
        Use current rates and side-by-side scenarios before making a bigger money decision.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/markets"
          style={{ ...buttonStyle, background: 'var(--ink)', color: 'var(--gold)', borderColor: 'var(--ink)' }}
        >
          Check Rates
        </Link>
        <Link href="/decisions" style={{ ...buttonStyle, background: 'white', color: 'var(--ink)' }}>
          Compare Options
        </Link>
      </div>
    </div>
  );
}
