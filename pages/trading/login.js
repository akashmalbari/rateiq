import { useState } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';
import { getSessionFromRequest, hasTradingAccess } from '../../lib/trading/auth';

export async function getServerSideProps({ req }) {
  const session = getSessionFromRequest(req);

  if (hasTradingAccess(session)) {
    return {
      redirect: {
        destination: '/trading',
        permanent: false,
      },
    };
  }

  return { props: {} };
}

function AuthModal({ title, message, actionLabel, onAction, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7, 17, 31, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          boxShadow: '0 24px 80px rgba(7, 17, 31, 0.18)',
          padding: '24px',
        }}
      >
        <h2 className="text-2xl font-display font-semibold mb-3">{title}</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{message}</p>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onAction}
            style={{
              background: 'var(--ink)',
              color: 'var(--gold)',
              border: 'none',
              padding: '12px 18px',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              padding: '12px 18px',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TradingLoginPage() {
  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  function resetMessages() {
    setError('');
    setSuccess('');
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const response = await fetch('/api/trading/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Login failed');
      }

      window.location.href = '/trading';
    } catch (err) {
      setError(err.message || 'Unable to login');
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    resetMessages();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/trading/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      const payload = await response.json().catch(() => ({}));
      if (response.status === 409 || payload.code === 'USER_EXISTS') {
        setModal({
          title: 'Account already exists',
          message: payload.error || 'This email is already registered. Please sign in instead.',
          actionLabel: 'Go to sign in',
          onAction: () => {
            setModal(null);
            switchMode('login');
          },
        });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Registration failed');
      }

      switchMode('login');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Registration successful. Please sign in with your new account.');
    } catch (err) {
      setError(err.message || 'Unable to register');
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <>
      <Head>
        <title>Trading Desk Access | Figure My Money</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="font-mono text-xs uppercase tracking-[0.35em] mb-3" style={{ color: 'var(--muted)' }}>
              Trading desk access
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              {isLogin ? 'Sign in to your trading account' : 'Create your trading account'}
            </h1>
            <p className="max-w-2xl mx-auto" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              Access the private trading scanner, save your account in the database, and securely sign in before entering the desk.
            </p>
          </div>

          <div
            style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 18px 60px rgba(7, 17, 31, 0.06)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  padding: '16px 18px',
                  border: 'none',
                  background: isLogin ? 'rgba(7, 17, 31, 0.06)' : 'transparent',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  padding: '16px 18px',
                  border: 'none',
                  background: !isLogin ? 'rgba(7, 17, 31, 0.06)' : 'transparent',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} style={{ padding: '26px' }}>
              {!isLogin ? (
                <div className="mb-4">
                  <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                    Full name
                  </label>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required={!isLogin} />
                </div>
              ) : null}

              <div className="mb-4">
                <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                  Email
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                  Password
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {!isLogin ? (
                <div className="mb-4">
                  <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              ) : null}

              {!isLogin ? (
                <p className="text-sm mb-6" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                  Your account is stored in Supabase and must use a unique email. If that email is already registered, you will be prompted to sign in instead.
                </p>
              ) : (
                <p className="text-sm mb-6" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                  Use the same email and password you registered with to enter the trading desk.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--ink)',
                  color: 'var(--gold)',
                  border: 'none',
                  padding: '13px 22px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                }}
              >
                {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
              </button>

              {success ? <p className="mt-4" style={{ color: '#1f7a47' }}>{success}</p> : null}
              {error ? <p className="mt-4" style={{ color: 'var(--red)' }}>{error}</p> : null}
            </form>
          </div>
        </main>
        <SiteFooter />

        {modal ? (
          <AuthModal
            title={modal.title}
            message={modal.message}
            actionLabel={modal.actionLabel}
            onAction={modal.onAction}
            onClose={() => setModal(null)}
          />
        ) : null}
      </div>
    </>
  );
}
