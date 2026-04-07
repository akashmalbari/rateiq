// components/Header.js
import Link from 'next/link';

export default function Header() {
  const navItems = [
    { href: '/decisions/housing', label: 'Housing' },
    { href: '/decisions/lifestyle', label: 'Lifestyle' },
    { href: '/decisions/wealth', label: 'Wealth' },
    { href: '/markets', label: 'Markets' },
    { href: '/trading', label: 'Trading' },
  ];

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'var(--paper)', borderBottom: '3px solid var(--ink)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div
            className="text-[10px] md:text-xs font-mono uppercase tracking-widest"
            style={{ color: 'var(--muted)' }}
          >
            Make smarter money decisions with data
          </div>
          <Link href="/">
            <h1
              className="text-3xl md:text-4xl font-display font-bold tracking-tight cursor-pointer"
              style={{ letterSpacing: '-0.02em' }}
            >
              Figure <span style={{ color: 'var(--gold)' }}>My Money</span>
            </h1>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center gap-10 text-base font-mono uppercase tracking-wider">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="text-right text-xs font-mono" style={{ color: 'var(--muted)' }}>
          <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>● LIVE</div>
        </div>
      </div>

      <nav
        className="md:hidden border-t px-4 md:px-6 py-3"
        style={{ borderColor: 'var(--border)', background: 'white' }}
        aria-label="Primary navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 overflow-x-auto whitespace-nowrap">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center px-4 py-2 border rounded-sm text-sm font-mono uppercase tracking-wider hover:underline"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)', background: 'var(--paper)' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
