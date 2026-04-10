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
        background: 'rgba(4, 10, 20, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '24px',
          border: '1px solid rgba(138, 171, 214, 0.22)',
          background:
            'radial-gradient(circle at top right, rgba(88, 183, 255, 0.14), transparent 34%), linear-gradient(180deg, rgba(15, 28, 48, 0.98), rgba(9, 18, 31, 0.98))',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45)',
          color: 'var(--ink)',
          padding: '28px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '10px',
            fontFamily: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
          }}
        >
          Account notice
        </div>
        <h2 className="text-2xl font-display font-semibold mb-3">{title}</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{message}</p>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onAction}
            style={{
              background: 'linear-gradient(135deg, rgba(88, 183, 255, 0.95), rgba(119, 209, 255, 0.86))',
              color: '#06111d',
              border: 'none',
              padding: '12px 18px',
              borderRadius: '999px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(9, 18, 31, 0.72)',
              color: 'var(--ink)',
              border: '1px solid rgba(138, 171, 214, 0.22)',
              padding: '12px 18px',
              borderRadius: '999px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
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

        <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">
          <style jsx>{`
            .auth-hero {
              text-align: center;
              margin-bottom: 34px;
            }
            .hero-copy {
              max-width: 860px;
              margin: 0 auto;
            }
            .auth-shell {
              display: grid;
              gap: 18px;
              grid-template-columns: 1.1fr minmax(0, 1.4fr);
              align-items: stretch;
            }
            .auth-side {
              padding: 24px;
              min-height: 100%;
            }
            .auth-side h2 {
              font-size: clamp(1.9rem, 3.4vw, 2.8rem);
              line-height: 1.05;
              margin-bottom: 14px;
            }
            .auth-side p {
              color: var(--muted);
              line-height: 1.85;
              font-size: 15px;
            }
            .side-grid {
              display: grid;
              gap: 12px;
              margin-top: 22px;
            }
            .side-chip {
              border: 1px solid rgba(138, 171, 214, 0.18);
              border-radius: 18px;
              background: rgba(8, 17, 29, 0.52);
              padding: 14px 16px;
            }
            .side-chip-title {
              color: var(--gold-light);
              font-size: 11px;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              margin-bottom: 6px;
              font-family: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
            }
            .side-chip-copy {
              color: var(--muted);
              font-size: 14px;
              line-height: 1.7;
            }
            .auth-card {
              overflow: hidden;
            }
            .auth-tabs {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0;
              padding: 8px;
              border-bottom: 1px solid rgba(138, 171, 214, 0.16);
              background: rgba(7, 14, 25, 0.52);
            }
            .auth-tab {
              border: 1px solid transparent;
              background: transparent;
              color: var(--muted);
              padding: 16px 18px;
              border-radius: 18px;
              font-weight: 700;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              transition: all 0.18s ease;
            }
            .auth-tab:hover {
              color: #d9e9ff;
            }
            .auth-tab.active {
              color: var(--ink);
              border-color: rgba(120, 195, 255, 0.3);
              background: linear-gradient(180deg, rgba(17, 34, 56, 0.96), rgba(10, 21, 36, 0.96));
              box-shadow: 0 0 0 1px rgba(120, 195, 255, 0.08);
            }
            .auth-form {
              padding: 26px;
            }
            .field-grid {
              display: grid;
              gap: 16px;
            }
            .field-label {
              display: block;
              margin-bottom: 8px;
              color: var(--gold-light);
              font-size: 11px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              font-family: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
            }
            .auth-input {
              width: 100%;
              border: 1px solid rgba(138, 171, 214, 0.28);
              border-radius: 14px;
              background: linear-gradient(180deg, rgba(9, 20, 34, 0.96), rgba(8, 18, 31, 0.96));
              color: #eaf3ff;
              padding: 12px 14px;
              font-size: 15px;
              outline: none;
              transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
              -webkit-text-fill-color: #eaf3ff;
            }
            .auth-input::placeholder {
              color: rgba(156, 180, 214, 0.72);
            }
            .auth-input:focus {
              border-color: rgba(120, 195, 255, 0.7);
              box-shadow: 0 0 0 3px rgba(88, 183, 255, 0.16);
              background: linear-gradient(180deg, rgba(11, 24, 40, 0.98), rgba(9, 20, 34, 0.98));
            }
            .auth-input:-webkit-autofill,
            .auth-input:-webkit-autofill:hover,
            .auth-input:-webkit-autofill:focus {
              -webkit-text-fill-color: #eaf3ff;
              transition: background-color 9999s ease-in-out 0s;
              box-shadow: 0 0 0px 1000px rgba(9, 20, 34, 0.96) inset;
              border: 1px solid rgba(138, 171, 214, 0.3);
            }
            .support-copy {
              color: var(--muted);
              line-height: 1.8;
              font-size: 15px;
              margin-top: 4px;
            }
            .support-note {
              margin-top: 18px;
              padding: 16px 18px;
              border-radius: 18px;
              border: 1px solid rgba(138, 171, 214, 0.16);
              background: rgba(8, 17, 29, 0.48);
              color: var(--muted);
              line-height: 1.8;
              font-size: 14px;
            }
            .message {
              margin-top: 16px;
              padding: 14px 16px;
              border-radius: 16px;
              font-size: 14px;
              line-height: 1.7;
              border: 1px solid transparent;
            }
            .message.success {
              background: rgba(21, 58, 44, 0.6);
              border-color: rgba(88, 224, 172, 0.28);
              color: #9ff0ca;
            }
            .message.error {
              background: rgba(66, 24, 36, 0.62);
              border-color: rgba(255, 107, 138, 0.26);
              color: #ffafbf;
            }
            .submit-row {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-top: 24px;
              flex-wrap: wrap;
            }
            .submit-btn {
              border: none;
              border-radius: 999px;
              padding: 14px 22px;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: #06111d;
              background: linear-gradient(135deg, rgba(88, 183, 255, 0.95), rgba(119, 209, 255, 0.84));
              box-shadow: 0 14px 34px rgba(73, 157, 220, 0.26);
              transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
            }
            .submit-btn:hover:enabled {
              transform: translateY(-1px);
              filter: brightness(1.05);
            }
            .submit-btn:disabled {
              opacity: 0.7;
              cursor: wait;
            }
            .submit-meta {
              color: var(--muted);
              font-size: 13px;
              letter-spacing: 0.04em;
            }
            @media (max-width: 960px) {
              .auth-shell {
                grid-template-columns: 1fr;
              }
            }
            @media (max-width: 640px) {
              .auth-form,
              .auth-side {
                padding: 18px;
              }
              .auth-tab {
                padding: 14px 10px;
                font-size: 11px;
              }
              .submit-row {
                flex-direction: column;
                align-items: stretch;
              }
              .submit-btn {
                width: 100%;
              }
            }
          `}</style>

          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-10" />

          <section className="auth-hero">
            <div className="hero-copy">
              <div className="eyebrow mb-4">Trading desk access</div>
              <h1 className="section-heading font-display font-semibold mb-5">
                {isLogin ? 'Sign in to your trading account' : 'Create your trading account'}
              </h1>
              <p className="text-lg md:text-xl" style={{ color: 'var(--muted)', lineHeight: 1.9 }}>
                Access the private trading scanner, store your account securely in the database, and sign in before entering the desk.
              </p>
            </div>
          </section>

          <section className="auth-shell">
            <div className="surface-card auth-side">
              <div className="eyebrow mb-4">Secure environment</div>
              <h2 className="font-display font-semibold">
                Built for a clean, private trading workflow.
              </h2>
              <p>
                Your access is protected behind a database-backed account system with secure session handling, duplicate-user detection,
                and a dedicated sign-in flow before you reach the scanner.
              </p>

              <div className="side-grid">
                <div className="side-chip">
                  <div className="side-chip-title">Private desk access</div>
                  <div className="side-chip-copy">Only authenticated users can load scanner results, run live analysis, or access the trading routes.</div>
                </div>
                <div className="side-chip">
                  <div className="side-chip-title">Supabase-backed accounts</div>
                  <div className="side-chip-copy">Registration is stored in the database and duplicate registrations are caught immediately.</div>
                </div>
                <div className="side-chip">
                  <div className="side-chip-title">Fast entry</div>
                  <div className="side-chip-copy">Sign in with your registered email and password, then go straight into the trading desk.</div>
                </div>
              </div>
            </div>

            <div className="surface-panel auth-card">
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${isLogin ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Register
                </button>
              </div>

              <form onSubmit={isLogin ? handleLogin : handleRegister} className="auth-form">
                <div className="field-grid">
                  {!isLogin ? (
                    <div>
                      <label className="field-label">Full name</label>
                      <input
                        className="auth-input"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required={!isLogin}
                        autoComplete="name"
                        placeholder="Enter your full name"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="field-label">Email</label>
                    <input
                      className="auth-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="name@example.com"
                    />
                  </div>

                  <div>
                    <label className="field-label">Password</label>
                    <input
                      className="auth-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      placeholder={isLogin ? 'Enter your password' : 'Minimum 8 characters'}
                    />
                  </div>

                  {!isLogin ? (
                    <div>
                      <label className="field-label">Confirm password</label>
                      <input
                        className="auth-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!isLogin}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="support-note">
                  {isLogin
                    ? 'Use the same email and password you registered with to enter the trading desk.'
                    : 'If already registered, please sign in instead.'}
                </div>

                <div className="submit-row">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
                  </button>
                  <div className="submit-meta">
                    {isLogin ? 'Private scanner access' : 'Register first, then sign in'}
                  </div>
                </div>

                {success ? <div className="message success">{success}</div> : null}
                {error ? <div className="message error">{error}</div> : null}
              </form>
            </div>
          </section>
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
