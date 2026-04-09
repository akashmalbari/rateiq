import Link from 'next/link';

export default function Header() {
  const navItems = [
    { href: '/decisions', label: 'Decisions' },
    { href: '/markets', label: 'Markets' },
    { href: '/calculators', label: 'Calculators' },
    { href: '/blog', label: 'Blog' },
    { href: '/trading', label: 'Trading' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(7, 17, 31, 0.78)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="eyebrow mb-2">Decision intelligence for modern money moves</div>
          <Link href="/" className="inline-flex items-center gap-3 min-w-0">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(88, 183, 255, 0.95), rgba(119, 209, 255, 0.78))',
                color: '#04101c',
                boxShadow: '0 12px 30px rgba(73, 157, 220, 0.26)',
              }}
            >
              FM
            </div>
            <div className="min-w-0">
              <div className="text-2xl md:text-3xl font-display font-semibold tracking-tight leading-none">
                Figure <span style={{ color: 'var(--gold)' }}>My Money</span>
              </div>
              <div className="text-sm truncate" style={{ color: 'var(--muted)' }}>
                Live rates, city-level markets, and scenario-first calculators.
              </div>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-2 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-pill"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          <span className="badge-live">Live rate coverage</span>
          <Link href="/decisions" className="glass-button">
            Start comparing
          </Link>
        </div>
      </div>

      <nav
        className="lg:hidden border-t px-4 md:px-6 py-3"
        style={{ borderColor: 'var(--border)' }}
        aria-label="Primary navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-pill nav-pill--compact"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
