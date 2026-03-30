import { useState } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';

export default function TradingLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/trading/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Login failed');
      }

      window.location.href = '/trading';
    } catch (err) {
      setError(err.message || 'Unable to login');
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Trading Admin Login | Figure My Money</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        <main className="max-w-xl mx-auto px-6 py-12">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />
          <h1 className="text-4xl font-display font-bold mb-3">Trading Admin Access</h1>
          <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
            Authorized access only.
          </p>

          <form onSubmit={onSubmit} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '22px' }}>
            <div className="mb-4">
              <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} style={{ background: 'var(--ink)', color: 'var(--gold)', border: 'none', padding: '12px 22px', borderRadius: '2px', fontWeight: 'bold' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            {error ? <p className="mt-4" style={{ color: 'var(--red)' }}>{error}</p> : null}
          </form>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
