'use client';

import Header from '../Header';
import TickerBar from '../TickerBar';
import Link from 'next/link';

export default function SiteChrome({ children, rates }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <TickerBar rates={rates} />
      {children}
      <footer
        style={{ borderTop: '3px solid var(--ink)', background: 'var(--cream)' }}
        className="py-6"
      >
        <div
          className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs font-mono"
          style={{ color: 'var(--muted)' }}
        >
          <div>Figure My Money calculators are educational tools, not financial advice.</div>
          <div className="flex items-center gap-4">
            <Link href="/calculators" className="underline">
              Calculators
            </Link>
            <Link href="/decisions" className="underline">
              Decisions
            </Link>
            <Link href="/calculator" className="underline">
              Original Calculator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
