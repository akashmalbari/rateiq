import { useState, useEffect, useCallback, useMemo } from "react";

const DEFAULT_API = "/api";

function normalizeApiBase(value = "") {
  const trimmed = String(value || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const CONFIGURED_API = normalizeApiBase(process.env.REACT_APP_BACKEND_URL);
const API_CANDIDATES = Array.from(new Set([DEFAULT_API, CONFIGURED_API].filter(Boolean)));

async function requestApi(path, options = {}) {
  let lastError = new Error("Request failed");

  for (let i = 0; i < API_CANDIDATES.length; i += 1) {
    const base = API_CANDIDATES[i];
    const isLast = i === API_CANDIDATES.length - 1;

    try {
      const res = await fetch(`${base}${path}`, options);
      const raw = await res.text();
      let data = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      const trimmed = raw.trim();
      const looksLikeHtml = /^<!doctype html/i.test(trimmed) || /^<html/i.test(trimmed);

      if (!res.ok) {
        const detail = typeof data?.detail === 'string'
          ? data.detail
          : typeof data?.message === 'string'
            ? data.message
            : (!looksLikeHtml && trimmed ? trimmed.slice(0, 240) : '');
        const err = new Error(detail || `${res.status} ${res.statusText}` || 'Request failed');
        err.status = res.status;

        if (!isLast && (res.status === 404 || res.status === 405 || (!detail && looksLikeHtml))) {
          lastError = err;
          continue;
        }

        throw err;
      }

      if (looksLikeHtml) {
        const err = new Error('API route returned HTML instead of JSON');
        err.status = res.status;
        if (!isLast) {
          lastError = err;
          continue;
        }
        throw err;
      }

      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Request failed');
      if (isLast) throw lastError;
    }
  }

  throw lastError;
}

// ─── V3 Design Tokens ──────────────────────────────────────────────────────────
const styles = `
  :root {
    --trading-bg: #040b16;
    --trading-surface: rgba(8,16,30,0.94);
    --trading-card: rgba(10,21,36,0.82);
    --trading-muted-bg: rgba(6,13,24,0.84);
    --trading-border: rgba(138,171,214,0.18);
    --trading-border-light: rgba(138,171,214,0.11);
    --trading-gold: #c8ab62;
    --trading-gold-light: #e2ce8a;
    --trading-muted: #8baabf;
    --trading-ink: #cbe2ff;
    --trading-green: #74f0b4;
    --trading-red: #ff8ea4;
    --trading-blue: rgba(88,183,255,0.96);
  }

  .t-page { background: var(--trading-bg); min-height: 100vh; color: var(--trading-ink); }
  .t-surface { background: var(--trading-surface); border: 1px solid var(--trading-border); border-radius: 22px; }
  .t-card { background: var(--trading-card); border: 1px solid var(--trading-border-light); border-radius: 16px; }
  .t-muted { background: var(--trading-muted-bg); border: 1px solid var(--trading-border-light); border-radius: 14px; }
  .t-eyebrow {
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--trading-gold); font-family: 'SFMono-Regular', Menlo, monospace; font-weight: 600;
  }

  .t-input {
    width: 100%; background: linear-gradient(180deg, rgba(9,20,34,0.96), rgba(8,18,31,0.96));
    border: 1px solid var(--trading-border); border-radius: 13px;
    color: var(--trading-ink); padding: 11px 14px; font-size: 14px; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .t-input:focus { border-color: rgba(120,195,255,0.65); box-shadow: 0 0 0 3px rgba(88,183,255,0.12); }
  .t-input::placeholder { color: rgba(139,170,191,0.55); }
  .t-input:-webkit-autofill, .t-input:-webkit-autofill:focus {
    -webkit-text-fill-color: var(--trading-ink);
    transition: background-color 9999s 0s;
    box-shadow: 0 0 0 1000px rgba(9,20,34,0.96) inset;
    border: 1px solid var(--trading-border);
  }

  .t-btn-primary {
    background: linear-gradient(135deg, rgba(88,183,255,0.96), rgba(119,209,255,0.86));
    color: #06111d; border: none; border-radius: 999px; padding: 13px 22px;
    font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; font-size: 12px;
    box-shadow: 0 12px 30px rgba(73,157,220,0.22);
    transition: transform 0.18s, filter 0.18s, opacity 0.18s; cursor: pointer;
  }
  .t-btn-primary:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.05); }
  .t-btn-primary:disabled { opacity: 0.65; cursor: wait; }

  .t-btn-ghost {
    background: rgba(9,18,31,0.62); color: var(--trading-ink);
    border: 1px solid var(--trading-border); border-radius: 999px; padding: 11px 18px;
    font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 11px;
    transition: transform 0.18s, border-color 0.18s; cursor: pointer;
  }
  .t-btn-ghost:hover:not(:disabled) { transform: translateY(-1px); border-color: rgba(138,171,214,0.4); }
  .t-btn-ghost:disabled { opacity: 0.65; cursor: wait; }

  .t-auth-tab {
    border: 1px solid transparent; background: transparent; color: var(--trading-muted);
    padding: 14px 18px; border-radius: 16px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; font-size: 11px; transition: all 0.18s; cursor: pointer;
  }
  .t-auth-tab:hover { color: var(--trading-ink); }
  .t-auth-tab.active {
    color: var(--trading-ink); border-color: rgba(120,195,255,0.28);
    background: linear-gradient(180deg, rgba(17,34,56,0.96), rgba(10,21,36,0.96));
    box-shadow: 0 0 0 1px rgba(120,195,255,0.08);
  }

  .t-signal-pill {
    display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 999px;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; border: 1px solid;
  }
  .t-signal-pill.buy { color: var(--trading-green); border-color: rgba(88,224,172,0.38); background: rgba(19,49,38,0.7); }
  .t-signal-pill.sell { color: var(--trading-red); border-color: rgba(255,107,138,0.36); background: rgba(56,18,28,0.72); }
  .t-signal-pill.hold { color: var(--trading-ink); border-color: var(--trading-border); background: rgba(10,19,32,0.72); }

  .t-strategy-card {
    border: 1px solid var(--trading-border-light); border-radius: 16px;
    background: rgba(10,18,31,0.82); padding: 14px; text-align: left;
    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s; cursor: pointer;
    width: 100%;
  }
  .t-strategy-card:hover { transform: translateY(-2px); border-color: rgba(120,195,255,0.36); }
  .t-strategy-card.active {
    border-color: rgba(120,195,255,0.6);
    box-shadow: 0 0 0 1px rgba(120,195,255,0.1);
    background: linear-gradient(180deg, rgba(15,31,54,0.92), rgba(10,20,35,0.9));
  }

  .t-ticker-chip {
    flex: 0 0 auto; min-width: 145px; border: 1px solid var(--trading-border-light);
    border-radius: 14px; background: rgba(8,17,29,0.72); padding: 10px 12px;
    cursor: pointer; text-align: left; transition: border-color 0.18s;
  }
  .t-ticker-chip:hover { border-color: rgba(138,171,214,0.35); }

  .t-confidence-track { height: 10px; border-radius: 999px; background: rgba(138,171,214,0.16); overflow: hidden; }
  .t-confidence-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #4aa6ff, #74f0b4); transition: width 0.35s; }

  .t-scroll-list { max-height: 520px; overflow-y: auto; }
  .t-terminal-grid { display: grid; gap: 16px; }
  @media (min-width: 1280px) { .t-terminal-grid { grid-template-columns: 290px minmax(0,1fr); } }

  .t-message { padding: 13px 16px; border-radius: 14px; font-size: 13px; line-height: 1.7; border: 1px solid; }
  .t-message.success { background: rgba(21,58,44,0.6); border-color: rgba(88,224,172,0.28); color: #9ff0ca; }
  .t-message.error { background: rgba(66,24,36,0.62); border-color: rgba(255,107,138,0.26); color: #ffafbf; }
  .t-info-list li::before { content: "›"; color: var(--trading-gold); margin-right: 8px; }
  .t-info-list li { display: flex; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = v => v == null || isNaN(Number(v)) ? '—' : `$${Number(v).toFixed(2)}`;
const fmtPct = v => v == null || isNaN(Number(v)) ? '—' : `${Number(v).toFixed(2)}%`;
const fmtRR = (entry, stop, target) => {
  const risk = Math.abs(Number(entry) - Number(stop));
  const reward = Math.abs(Number(target) - Number(entry));
  return (!risk || isNaN(risk) || isNaN(reward)) ? '—' : `${(reward / risk).toFixed(1)}:1`;
};
const tone = action => action === 'BUY' ? 'buy' : action === 'SELL' ? 'sell' : 'hold';
function regime(signals = []) {
  if (!signals.length) return { label: 'Scanner idle', tone: 'hold', desc: 'No stored scanner signals available yet.' };
  const buys = signals.filter(s => s.action === 'BUY').length;
  const sells = signals.filter(s => s.action === 'SELL').length;
  if (buys > sells) return { label: 'Bullish scanner tilt', tone: 'buy', desc: `${buys} buy signals vs ${sells} sell signals.` };
  if (sells > buys) return { label: 'Bearish scanner tilt', tone: 'sell', desc: `${sells} sell signals vs ${buys} buy signals.` };
  return { label: 'Balanced scanner', tone: 'hold', desc: `Even split — ${buys} buy and ${sells} sell.` };
}
function histStats(sig) {
  if (sig?.source !== 'live') return 'Stored scanner signal — run live analysis to refresh with current quote.';
  if (!sig?.sampleSize || sig.winRate == null) return 'Historical performance will appear once enough tracked signals are resolved.';
  return `Win rate ${sig.winRate}% · Sample ${sig.sampleSize} · Avg return ${sig.avgReturn == null ? '—' : fmtPct(sig.avgReturn)}`;
}

const STRATEGIES = [
  { value: 'momentum', label: 'Momentum', summary: 'RSI + MACD + moving-average confirmation.' },
  { value: 'mean_reversion', label: 'Mean Reversion', summary: 'Bollinger extremes and oversold / overbought reversals.' },
  { value: 'breakout', label: 'Breakout', summary: 'Volume expansion and ATR-driven continuation setups.' },
  { value: 'volatility', label: 'Volatility', summary: 'Volatility regime and direction-aware options bias.' },
];

function MetricCard({ label, value, accent }) {
  return (
    <div className="t-muted p-4">
      <div className="t-eyebrow mb-2">{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: accent || 'var(--trading-ink)', fontFamily: "'SFMono-Regular', Menlo, monospace" }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(null);

  const reset = () => { setError(''); setSuccess(''); };
  const switchMode = m => { setMode(m); reset(); setPassword(''); setConfirm(''); };
  const isLogin = mode === 'login';

  async function handleLogin(e) {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const data = await requestApi('/trading/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('trading_token', data.token);
      localStorage.setItem('trading_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Unable to login');
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault(); reset();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const data = await requestApi('/trading/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: name }),
      }).catch(err => {
        if (err?.status === 409 || err?.message?.toLowerCase().includes('already registered')) {
          setModal({ title: 'Account already exists', message: err.message || 'This email is already registered.', actionLabel: 'Go to sign in', onAction: () => { setModal(null); switchMode('login'); } });
          return null;
        }
        throw err;
      });
      if (!data) {
        setLoading(false); return;
      }
      switchMode('login');
      setSuccess('Account created. Please sign in with your new account.');
    } catch (err) {
      setError(err.message || 'Unable to register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="t-page" style={{ minHeight: '100vh', padding: '48px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="t-eyebrow" style={{ marginBottom: '12px' }}>Trading desk access</div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.07, color: 'var(--trading-ink)', marginBottom: '14px' }}>
            {isLogin ? 'Sign in to your trading account' : 'Create your trading account'}
          </h1>
          <p style={{ color: 'var(--trading-muted)', lineHeight: 1.9, fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Access the private trading scanner, run live analysis, and inspect high-conviction signals across 30 top stocks.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'clamp(0px, 100%, 340px) minmax(0, 1fr)', alignItems: 'stretch' }}
          className="auth-shell-grid">
          {/* Left panel */}
          <div className="t-card" style={{ padding: '26px' }}>
            <div className="t-eyebrow" style={{ marginBottom: '12px' }}>Secure environment</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--trading-ink)', marginBottom: '12px' }}>
              Built for a clean, private trading workflow.
            </h2>
            <p style={{ color: 'var(--trading-muted)', lineHeight: 1.85, fontSize: '14px' }}>
              Your access is protected with a database-backed account and secure session handling before you reach the scanner.
            </p>
            <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
              {[
                { label: 'Private desk access', copy: 'Only authenticated users can load scanner results or run live analysis.' },
                { label: 'Fast entry', copy: 'Sign in with your registered email and go straight to the algorithm-backed scanner.' },
                { label: '30 stocks scanned', copy: 'Top S&P 500 names ranked by signal conviction across 4 strategies.' },
              ].map((f, i) => (
                <div key={i} className="t-muted" style={{ padding: '14px 16px' }}>
                  <div className="t-eyebrow" style={{ marginBottom: '6px' }}>{f.label}</div>
                  <div style={{ color: 'var(--trading-muted)', fontSize: '13px', lineHeight: 1.7 }}>{f.copy}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Auth card */}
          <div className="t-surface" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '8px', borderBottom: '1px solid var(--trading-border)', background: 'rgba(7,14,25,0.52)' }}>
              <button className={`t-auth-tab ${isLogin ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign in</button>
              <button className={`t-auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => switchMode('register')}>Register</button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} style={{ padding: '26px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                {!isLogin && (
                  <div>
                    <label className="t-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Full name</label>
                    <input className="t-input" value={name} onChange={e => setName(e.target.value)} required={!isLogin} autoComplete="name" placeholder="Enter your full name" data-testid="auth-name" />
                  </div>
                )}
                <div>
                  <label className="t-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
                  <input className="t-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="name@example.com" data-testid="auth-email" />
                </div>
                <div>
                  <label className="t-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Password</label>
                  <input className="t-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? 'Enter your password' : 'Minimum 8 characters'} data-testid="auth-password" />
                </div>
                {!isLogin && (
                  <div>
                    <label className="t-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Confirm password</label>
                    <input className="t-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required={!isLogin} autoComplete="new-password" placeholder="Re-enter your password" data-testid="auth-confirm" />
                  </div>
                )}
              </div>

              <div className="t-muted" style={{ marginTop: '18px', padding: '14px 16px', fontSize: '13px', color: 'var(--trading-muted)', lineHeight: 1.75 }}>
                {isLogin ? 'Use the email and password you registered with to enter the trading desk.' : 'If already registered, please sign in instead. Passwords must be at least 8 characters.'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '22px', flexWrap: 'wrap' }}>
                <button type="submit" className="t-btn-primary" disabled={loading} data-testid="auth-submit">
                  {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
                </button>
                <span style={{ color: 'var(--trading-muted)', fontSize: '12px' }}>
                  {isLogin ? 'Private scanner access' : 'Register first, then sign in'}
                </span>
              </div>

              {success && <div className="t-message success" style={{ marginTop: '16px' }}>{success}</div>}
              {error && <div className="t-message error" style={{ marginTop: '16px' }} data-testid="auth-error">{error}</div>}
            </form>
          </div>
        </div>
      </div>

      {/* Conflict modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,10,20,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 60 }}>
          <div className="t-surface" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <div className="t-eyebrow" style={{ marginBottom: '10px' }}>Account notice</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--trading-ink)', marginBottom: '10px' }}>{modal.title}</h2>
            <p style={{ color: 'var(--trading-muted)', lineHeight: 1.8 }}>{modal.message}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
              <button className="t-btn-primary" onClick={modal.onAction}>{modal.actionLabel}</button>
              <button className="t-btn-ghost" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trading Terminal ─────────────────────────────────────────────────────────
function TradingTerminal({ user, onLogout }) {
  const [symbol, setSymbol] = useState('AAPL');
  const [strategy, setStrategy] = useState('momentum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signal, setSignal] = useState(null);
  const [scannerSignals, setScannerSignals] = useState([]);
  const [scanMeta, setScanMeta] = useState({ status: 'Loading stored scanner results…', generatedAt: null, scanned: null });

  const token = localStorage.getItem('trading_token') || '';
  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const loadScanner = useCallback(async (refresh = false) => {
    setScanMeta(p => ({ ...p, status: refresh ? 'Refreshing live scanner results…' : 'Loading scanner results…' }));
    try {
      const data = await requestApi(`/trading/scan-results${refresh ? '?refresh=1' : ''}`, { headers: authHeader });
      const rows = Array.isArray(data.topSignals) ? data.topSignals : [];
      setScannerSignals(rows);
      setScanMeta({ status: rows.length ? (data.source === 'live' ? 'Live scanner results refreshed' : 'Stored ranked scanner results loaded') : 'Scanner returned zero live signals for this run', generatedAt: data.generatedAt || null, scanned: data.scanned || null });
    } catch (err) {
      setScannerSignals([]);
      setScanMeta({ status: err.message || 'Unable to load scanner results', generatedAt: null, scanned: null });
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadScanner(); }, [loadScanner]);

  const analyze = useCallback(async (sym = symbol) => {
    const s = sym.trim().toUpperCase();
    if (!s) return;
    setLoading(true); setError('');
    try {
      const data = await requestApi('/trading/analyze', {
        method: 'POST', headers: authHeader, body: JSON.stringify({ symbol: s, strategy }),
      });
      setSignal({ ...data, source: 'live' }); setSymbol(s);
    } catch (err) {
      setError(err.message || 'Unable to analyze signal');
    } finally {
      setLoading(false);
    }
  }, [strategy, symbol]); // eslint-disable-line

  const scanRegime = useMemo(() => regime(scannerSignals), [scannerSignals]);
  const sigTone = tone(signal?.action);
  const rr = signal ? fmtRR(signal.entryPrice, signal.stopLoss, signal.targetPrice) : '—';

  function previewScanner(row) {
    setSignal({ symbol: row.symbol, strategy: row.strategy || 'momentum', action: row.action || 'HOLD', confidence: row.confidence || 0, rankingScore: row.rankingScore ?? null, entryPrice: row.entryPrice, stopLoss: row.stopLoss, targetPrice: row.targetPrice, indicators: row.indicators || {}, reasons: row.reasons || [], profileName: row.profileName || `${row.symbol} · scanner snapshot`, scoreBreakdown: row.scoreBreakdown || null, source: 'scanner', winRate: null, sampleSize: 0, avgReturn: null });
    setSymbol(row.symbol || '');
    setStrategy(row.strategy || 'momentum');
    setError('');
  }

  return (
    <div className="t-page" style={{ padding: '0 0 60px' }}>
      {/* Header block */}
      <div className="t-surface" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '24px clamp(16px,4vw,32px) 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="t-eyebrow" style={{ marginBottom: '10px' }}>Trading intelligence terminal</div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 700, lineHeight: 1.05, color: 'var(--trading-ink)', marginBottom: '10px' }}>
              Precision market radar for your best setups.
            </h1>
            <p style={{ color: 'var(--trading-muted)', lineHeight: 1.8, maxWidth: '580px', fontSize: '14px' }}>
              Track ranked scanner signals, inspect high-conviction opportunities, and refresh live analysis whenever you want the latest market read.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            <span className={`t-signal-pill ${scanRegime.tone}`} data-testid="regime-pill">{scanRegime.label}</span>
            <p style={{ color: 'var(--trading-muted)', fontSize: '12px', textAlign: 'right', maxWidth: '240px' }}>{scanRegime.desc}</p>
            <p style={{ color: 'rgba(139,170,191,0.5)', fontSize: '11px' }}>{user.displayName || user.email} · {user.role}</p>
            <button className="t-btn-ghost" style={{ fontSize: '10px', padding: '7px 14px' }} onClick={onLogout} data-testid="logout-btn">Log out</button>
          </div>
        </div>
      </div>

      {/* Ticker strip */}
      {scannerSignals.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '14px clamp(16px,4vw,32px)', borderBottom: '1px solid var(--trading-border)', background: 'rgba(4,11,22,0.72)' }}>
          {scannerSignals.slice(0, 8).map((row, i) => (
            <button key={i} className="t-ticker-chip" onClick={() => previewScanner(row)} data-testid={`chip-${row.symbol}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--trading-gold-light)' }}>{row.symbol}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: row.action === 'BUY' ? 'var(--trading-green)' : row.action === 'SELL' ? 'var(--trading-red)' : 'var(--trading-muted)' }}>{row.action}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--trading-ink)' }}>{fmtPrice(row.entryPrice)}</div>
              <div style={{ fontSize: '10px', color: 'var(--trading-muted)', marginTop: '2px' }}>Conf {row.confidence}% · Rank {row.rankingScore ?? '—'}</div>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px clamp(16px,4vw,32px)' }}>
        <div className="t-terminal-grid">
          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="t-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="t-eyebrow">Latest scanner signals</div>
                <button className="t-btn-ghost" style={{ fontSize: '10px', padding: '7px 12px' }} onClick={() => loadScanner(true)} data-testid="scanner-refresh">Refresh</button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--trading-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
                {scanMeta.status}{scanMeta.generatedAt ? ` · ${new Date(scanMeta.generatedAt).toLocaleString()}` : ''}{scanMeta.scanned ? ` · ${scanMeta.scanned} stocks` : ''}
              </div>
              <div className="t-scroll-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scannerSignals.length ? scannerSignals.slice(0, 12).map((row, i) => (
                  <button key={i} onClick={() => previewScanner(row)} className="t-muted" style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', width: '100%', background: 'none', border: '1px solid var(--trading-border-light)', borderRadius: '12px', transition: 'border-color 0.18s' }} data-testid={`scanner-row-${i}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--trading-ink)', fontSize: '14px' }}>{row.symbol}</div>
                        <div style={{ fontSize: '11px', color: 'var(--trading-muted)' }}>{(row.strategy || '').replace('_', ' ')}</div>
                      </div>
                      <span className={`t-signal-pill ${tone(row.action)}`}>{row.action}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--trading-muted)' }}>
                      <span>Conf {row.confidence}% · Rank {row.rankingScore ?? '—'}</span>
                      <span style={{ color: 'var(--trading-ink)' }}>{fmtPrice(row.entryPrice)}</span>
                    </div>
                  </button>
                )) : (
                  <p style={{ fontSize: '12px', color: 'var(--trading-muted)', textAlign: 'center', padding: '20px 0' }}>No stored signals yet. Click Refresh to run the scanner.</p>
                )}
              </div>
            </div>

            <div className="t-card" style={{ padding: '18px 20px' }}>
              <div className="t-eyebrow" style={{ marginBottom: '12px' }}>What powers each signal</div>
              <div style={{ fontSize: '13px', color: 'var(--trading-muted)', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p>Each symbol is evaluated with a rules-based model that checks live quote data and core technical inputs — RSI, MACD, volatility, volume, and trend alignment.</p>
                <p>Weak or conflicting setups are filtered out. Remaining names are ranked by confidence so the strongest candidates rise to the top first.</p>
                <p>Every setup stays transparent. You can review the entry, stop, target, and indicator breakdown, then run fresh live analysis at any time.</p>
              </div>
            </div>
          </aside>

          {/* Main analysis pane */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Input + strategy */}
            <div className="t-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '12px', marginBottom: '16px' }}>
                <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="Enter ticker (AAPL, NVDA, SPY…)"
                  className="t-input" onKeyDown={e => e.key === 'Enter' && analyze(symbol)} data-testid="ticker-input" />
                <button className="t-btn-primary" style={{ borderRadius: '13px', padding: '11px 20px', fontSize: '12px', whiteSpace: 'nowrap' }} onClick={() => analyze(symbol)} disabled={loading} data-testid="analyze-btn">
                  {loading ? 'Analyzing…' : 'Run live analysis'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '10px' }}>
                {STRATEGIES.map(s => (
                  <button key={s.value} className={`t-strategy-card ${strategy === s.value ? 'active' : ''}`} onClick={() => setStrategy(s.value)} data-testid={`strategy-${s.value}`}>
                    <div className="t-eyebrow" style={{ marginBottom: '6px' }}>Strategy</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--trading-ink)', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--trading-muted)', lineHeight: 1.6 }}>{s.summary}</div>
                  </button>
                ))}
              </div>
              {error && <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--trading-red)' }} data-testid="analyze-error">{error}</p>}
            </div>

            {signal ? (
              <div className="t-surface" style={{ padding: '20px 24px' }}>
                {/* Signal header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <div className="t-eyebrow" style={{ marginBottom: '8px' }}>{signal.source === 'scanner' ? 'Scanner snapshot' : 'Live analysis'}</div>
                    <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 700, color: 'var(--trading-ink)', marginBottom: '6px' }} data-testid="signal-symbol">{signal.symbol}</h2>
                    <p style={{ color: 'var(--trading-muted)', lineHeight: 1.7 }}>{signal.profileName}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <span className={`t-signal-pill ${sigTone}`} style={{ fontSize: '13px', padding: '10px 16px' }} data-testid="signal-action">{signal.action}</span>
                    <span style={{ fontSize: '12px', color: 'var(--trading-muted)' }}>Strategy: {(signal.strategy || strategy).replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="t-muted" style={{ padding: '16px 18px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div className="t-eyebrow" style={{ marginBottom: '6px' }}>Confidence</div>
                      <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--trading-ink)' }} data-testid="signal-confidence">{signal.confidence || 0}%</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--trading-muted)', textAlign: 'right', maxWidth: '280px', lineHeight: 1.6 }}>
                      {histStats(signal)}{signal.rankingScore != null ? ` · Rank ${signal.rankingScore}` : ''}
                    </div>
                  </div>
                  <div className="t-confidence-track">
                    <div className="t-confidence-fill" style={{ width: `${signal.confidence || 0}%` }} />
                  </div>
                </div>

                {/* Key levels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px', marginBottom: '12px' }}>
                  <MetricCard label="Entry" value={fmtPrice(signal.entryPrice)} accent="var(--trading-gold-light)" />
                  <MetricCard label="Stop loss" value={fmtPrice(signal.stopLoss)} accent="var(--trading-red)" />
                  <MetricCard label="Target" value={fmtPrice(signal.targetPrice)} accent="var(--trading-green)" />
                  <MetricCard label="Risk / reward" value={rr} />
                </div>

                {/* Indicators */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px', marginBottom: '12px' }}>
                  <MetricCard label="RSI" value={signal.indicators?.rsi ?? '—'} />
                  <MetricCard label="MACD histogram" value={signal.indicators?.macdHist ?? '—'} />
                  <MetricCard label="BB %B" value={signal.indicators?.bbPct ?? '—'} />
                  <MetricCard label="Stochastic K" value={signal.indicators?.stochK ?? '—'} />
                  <MetricCard label="ATR %" value={fmtPct(signal.indicators?.atrPct)} />
                  <MetricCard label="Volume ratio" value={signal.indicators?.volRatio ? `${signal.indicators.volRatio}x` : '—'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px', marginBottom: '14px' }}>
                  <MetricCard label="50 SMA" value={fmtPrice(signal.indicators?.sma50)} />
                  <MetricCard label="200 SMA" value={fmtPrice(signal.indicators?.sma200)} />
                  <MetricCard label="Volatility proxy" value={fmtPct(signal.indicators?.ivPct)} />
                  <MetricCard label="Score split" value={signal.scoreBreakdown ? `${signal.scoreBreakdown.bull} / ${signal.scoreBreakdown.bear}` : '—'} />
                </div>

                {/* Reasoning */}
                {(signal.reasons || []).length > 0 && (
                  <div className="t-card" style={{ padding: '16px 18px', marginBottom: '14px' }}>
                    <div className="t-eyebrow" style={{ marginBottom: '12px' }}>Signal reasoning</div>
                    <ul className="t-info-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#d7e6fb', lineHeight: 1.75 }}>
                      {(signal.reasons || []).slice(0, 6).map((r, i) => (
                        <li key={i} style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--trading-gold)', flexShrink: 0 }}>›</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="t-btn-ghost" onClick={() => analyze(signal.symbol || symbol)} disabled={loading} data-testid="refresh-live-btn" style={{ borderRadius: '13px' }}>Refresh live</button>
                  <button className="t-btn-ghost" onClick={() => setSignal(null)} style={{ borderRadius: '13px' }}>Clear</button>
                </div>
              </div>
            ) : (
              <div className="t-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div className="t-eyebrow" style={{ marginBottom: '12px' }}>Ready</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--trading-ink)', marginBottom: '10px' }}>Start from the scanner or analyze manually</h2>
                <p style={{ color: 'var(--trading-muted)', lineHeight: 1.85, maxWidth: '500px', margin: '0 auto', fontSize: '14px' }}>
                  Click a stored scanner signal from the sidebar to inspect it instantly, then refresh live only when you need fresh Finnhub data.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TradingPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    document.title = 'Trading Intelligence Terminal | FigureMyMoney';
    const token = localStorage.getItem('trading_token');
    const stored = localStorage.getItem('trading_user');
    if (!token || !stored) { setChecking(false); return; }
    requestApi('/trading/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(data => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(u) { setUser(u); }
  function handleLogout() {
    localStorage.removeItem('trading_token');
    localStorage.removeItem('trading_user');
    setUser(null);
  }

  if (checking) {
    return (
      <div className="t-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="t-eyebrow" style={{ marginBottom: '8px' }}>Trading desk</div>
          <p style={{ color: 'var(--trading-muted)', fontSize: '14px' }}>Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      {user ? <TradingTerminal user={user} onLogout={handleLogout} /> : <AuthPage onLogin={handleLogin} />}
    </>
  );
}
