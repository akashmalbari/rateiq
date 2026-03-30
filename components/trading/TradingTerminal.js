import { useState } from 'react';

const WATCHLIST = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA', 'AMZN', 'META'];
const STRATEGIES = [
  { value: 'momentum', label: 'Momentum' },
  { value: 'mean_reversion', label: 'Mean Reversion' },
  { value: 'breakout', label: 'Breakout' },
  { value: 'volatility', label: 'Volatility' },
];

const fp = (p) => (p == null ? '—' : `$${Number(p).toFixed(2)}`);

export default function TradingTerminal() {
  const [symbol, setSymbol] = useState('AAPL');
  const [strategy, setStrategy] = useState('momentum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signal, setSignal] = useState(null);

  async function analyze(target = symbol) {
    const sym = target.trim().toUpperCase();
    if (!sym) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/trading/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym, strategy }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Analyze failed');

      setSignal(payload);
      setSymbol(sym);
    } catch (err) {
      setError(err.message || 'Unable to analyze signal');
      setSignal(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />

      <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Trading Intelligence</h1>
      <p className="font-mono text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Admin-only live signal engine with tracked outcomes and real confidence.
      </p>

      <section className="mb-6" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '16px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Ticker (AAPL, SPY...)"
          />

          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            {STRATEGIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <button
            onClick={() => analyze(symbol)}
            disabled={loading}
            style={{ background: 'var(--ink)', color: 'var(--gold)', border: 'none', borderRadius: '2px', padding: '10px 18px', fontWeight: 'bold' }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>

          <button
            onClick={async () => {
              await fetch('/api/trading/logout', { method: 'POST' });
              window.location.href = '/trading/login';
            }}
            style={{ background: 'white', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '2px', padding: '10px 18px', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {WATCHLIST.map((item) => (
            <button
              key={item}
              onClick={() => analyze(item)}
              style={{ border: '1px solid var(--border)', borderRadius: '2px', background: 'var(--paper)', padding: '8px 10px', fontSize: '12px', fontFamily: 'monospace' }}
            >
              {item}
            </button>
          ))}
        </div>

        {error ? <p className="mt-3" style={{ color: 'var(--red)' }}>{error}</p> : null}
      </section>

      <section style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '16px' }}>
        {!signal ? (
          <p style={{ color: 'var(--muted)' }}>Run an analysis to view signal output.</p>
        ) : (
          <>
            <h2 className="text-2xl font-display font-bold mb-3">{signal.symbol} — {signal.profileName}</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Metric label="Action" value={signal.action} accent={signal.action === 'BUY' ? 'var(--green)' : signal.action === 'SELL' ? 'var(--red)' : 'var(--gold)'} />
              <Metric label="Entry" value={fp(signal.entryPrice)} />
              <Metric label="Stop" value={fp(signal.stopLoss)} />
              <Metric label="Target" value={fp(signal.targetPrice)} />
            </div>

            <div className="mb-4 p-3" style={{ border: '1px solid var(--border)', borderRadius: '2px', background: 'var(--paper)' }}>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Win Rate: {signal.winRate}% (n={signal.sampleSize})
              </div>
              <div className="text-xl font-display font-bold">Confidence: {signal.confidence}%</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Metric label="RSI" value={signal.indicators?.rsi} />
              <Metric label="MACD Hist" value={signal.indicators?.macdHist} />
              <Metric label="ATR %" value={((signal.indicators?.atr / signal.entryPrice) * 100 || 0).toFixed(2) + '%'} />
              <Metric label="Vol Ratio" value={`${signal.indicators?.volRatio || 0}x`} />
            </div>

            <h3 className="text-sm font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Reasoning</h3>
            <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '18px' }}>
              {(signal.reasons || []).slice(0, 5).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '2px', padding: '10px', background: 'var(--paper)' }}>
      <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="text-base md:text-lg font-display font-bold" style={{ color: accent || 'var(--ink)' }}>{value ?? '—'}</div>
    </div>
  );
}
