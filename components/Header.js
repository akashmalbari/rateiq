// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ background: 'var(--paper)', borderBottom: '3px solid var(--ink)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest"
               style={{ color: 'var(--muted)' }}>
            The Financial Intelligence Platform
          </div>
          <Link href="/">
            <h1 className="text-4xl font-display font-bold tracking-tight cursor-pointer"
                style={{ letterSpacing: '-0.02em' }}>
              Rate<span style={{ color: 'var(--gold)' }}>IQ</span>
            </h1>
          </Link>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-mono uppercase tracking-wide">
          <Link href="/"           className="hover:underline">Dashboard</Link>
          <Link href="/advisor"    className="hover:underline">Advisor</Link>
          <Link href="/calculator" className="hover:underline">Calculator</Link>
          <Link href="/markets"    className="hover:underline">Markets</Link>
        </nav>
        <div className="text-right text-xs font-mono" style={{ color: 'var(--muted)' }}>
          <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>● LIVE</div>
        </div>
      </div>
    </header>
  );
}
