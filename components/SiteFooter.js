'use client';

import { useState } from 'react';
import Link from 'next/link';

const exploreLinks = [
  { href: '/decisions', label: 'Decision calculators' },
  { href: '/markets', label: 'City-wise markets' },
  { href: '/calculators', label: 'Calculator hub' },
  { href: '/blog', label: 'Finance blog' },
];

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
];

export default function SiteFooter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function onSubscribe(event) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to subscribe right now.');
      }

      setStatus('success');
      setMessage('You are subscribed. Thank you!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Unable to subscribe right now.');
    }
  }

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 mt-16 mb-8">
        <div
          style={{
            border: '1px solid #244a78',
            borderRadius: '28px',
            padding: '30px',
            background:
              'radial-gradient(380px 180px at 70% 95%, rgba(54, 147, 255, 0.25), transparent 65%), linear-gradient(180deg, rgba(6, 21, 45, 0.98), rgba(3, 14, 33, 0.98))',
            boxShadow: 'inset 0 0 0 1px rgba(128, 176, 255, 0.12)',
          }}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,470px)] lg:items-end">
            <div>
              <h3 className="text-2xl md:text-4xl font-display font-semibold mb-2 md:mb-3">Get updates</h3>
              <p className="text-base md:text-lg" style={{ color: 'rgba(191, 215, 247, 0.9)', maxWidth: '640px', lineHeight: 1.6 }}>
                Subscribe for new calculators and market updates.
              </p>
            </div>

            <form onSubmit={onSubscribe}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    border: '1px solid rgba(93, 140, 201, 0.45)',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(7, 18, 37, 0.78)',
                    color: '#dce9fb',
                    fontSize: '1.05rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    padding: '14px 28px',
                    minWidth: '210px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #7cd2ff, #56aef2)',
                    color: '#041528',
                    boxShadow: '0 14px 30px rgba(64, 154, 227, 0.35)',
                    cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                    opacity: status === 'submitting' ? 0.8 : 1,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {status === 'submitting' ? 'Submitting…' : 'Subscribe'}
                </button>
              </div>
              {message ? (
                <p className="text-sm mt-3" style={{ color: status === 'error' ? '#ff9c9c' : '#bfdbfe' }}>
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      <footer
        className="border-t"
        style={{
          borderColor: 'var(--border)',
          background: 'linear-gradient(180deg, rgba(5, 10, 18, 0.94), rgba(3, 8, 16, 0.98))',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_.8fr_.8fr]">
          <div>
            <div className="eyebrow mb-3">Figure My Money</div>
            <h2 className="text-3xl font-display font-semibold mb-4" style={{ lineHeight: 1.05 }}>
              Research-first tools for housing, markets, and wealth decisions.
            </h2>
            <p className="max-w-xl hidden md:block" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              Compare real scenarios, inspect city-level real estate data, and move from uncertainty to a clearer next step.
              We keep the inputs practical, the outputs transparent, and the affiliate relationships clearly disclosed.
            </p>
          </div>

          <div>
            <div className="eyebrow mb-3">Explore</div>
            <ul className="space-y-3">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-arrow">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-3">Company</div>
            <ul className="space-y-3 mb-6">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-arrow">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>


            <div className="surface-muted p-4">
              <div className="text-sm font-semibold mb-1">Educational only</div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Not financial advice. Market data may be delayed and partner links may generate compensation at no extra cost to you.
              </p>
            </div>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <div>© 2026 Figure My Money · Built for better financial decisions.</div>
          <div>Data sources: FRED / Federal Reserve / public market datasets.</div>
        </div>
      </div>
      </footer>
    </>
  );
}
