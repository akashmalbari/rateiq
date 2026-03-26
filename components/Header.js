// components/Header.js
import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/advisor', label: 'Advisor' },
    { href: '/calculator', label: 'Calculator' },
    { href: '/decisions', label: 'Decisions' },
    { href: '/markets', label: 'Markets' },
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
            The Financial Intelligence Platform
          </div>
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <h1
              className="text-3xl md:text-4xl font-display font-bold tracking-tight cursor-pointer"
              style={{ letterSpacing: '-0.02em' }}
            >
              Rate<span style={{ color: 'var(--gold)' }}>IQ</span>
            </h1>
          </Link>
        </div>

        <nav className="hidden md:flex gap-8 text-sm font-mono uppercase tracking-wide">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block text-right text-xs font-mono" style={{ color: 'var(--muted)' }}>
          <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>● LIVE</div>
        </div>

        <button
          type="button"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          className="md:hidden inline-flex items-center justify-center w-12 h-12 border rounded-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)', background: 'white' }}
          onClick={() => setIsMenuOpen(open => !open)}
        >
          <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
          <span className="flex flex-col gap-1.5">
            <span
              className="block w-5 h-0.5 transition-transform"
              style={{ background: 'var(--ink)', transform: isMenuOpen ? 'translateY(8px) rotate(45deg)' : 'none' }}
            />
            <span
              className="block w-5 h-0.5 transition-opacity"
              style={{ background: 'var(--ink)', opacity: isMenuOpen ? 0 : 1 }}
            />
            <span
              className="block w-5 h-0.5 transition-transform"
              style={{ background: 'var(--ink)', transform: isMenuOpen ? 'translateY(-8px) rotate(-45deg)' : 'none' }}
            />
          </span>
        </button>
      </div>

      {isMenuOpen && (
        <nav
          className="md:hidden border-t px-4 pb-4"
          style={{ borderColor: 'var(--border)', background: 'var(--paper)' }}
        >
          <div className="flex flex-col gap-2 pt-4 text-sm font-mono uppercase tracking-wide">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-3 border rounded-sm"
                style={{ borderColor: 'var(--border)', background: 'white' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 text-xs font-mono" style={{ color: 'var(--muted)' }}>
              <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>● LIVE</div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
