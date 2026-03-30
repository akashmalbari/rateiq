import { useState } from 'react';

const STRATEGIES = [
  { value: 'momentum', label: 'MOMENTUM' },
  { value: 'mean_reversion', label: 'MEAN REVERSION' },
  { value: 'breakout', label: 'BREAKOUT' },
  { value: 'volatility', label: 'VOLATILITY' },
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
      <style jsx>{`
        .terminal-shell {
          background: #0b0f16;
          border: 1px solid #1f2a37;
          border-radius: 4px;
          color: #e6edf6;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }
        .terminal-bar {
          border-bottom: 1px solid #1f2a37;
          background: linear-gradient(180deg, #101722 0%, #0d131d 100%);
        }
        .terminal-input,
        .terminal-select {
          width: 100%;
          background: #0f1724;
          border: 1px solid #223248;
          border-radius: 2px;
          color: #e6edf6;
          padding: 10px 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 13px;
          letter-spacing: 0.04em;
        }
        .terminal-input:focus,
        .terminal-select:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.35);
        }
        .terminal-btn {
          width: 100%;
          border-radius: 2px;
          border: 1px solid #223248;
          padding: 10px 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          font-size: 12px;
          text-transform: uppercase;
          transition: all 0.15s ease;
        }
        .analyze {
          background: #00d4ff;
          color: #061019;
          border-color: #00d4ff;
        }
        .analyze:hover {
          filter: brightness(1.07);
        }
        .logout {
          background: #0f1724;
          color: #b8c6d9;
        }
        .logout:hover {
          border-color: #3a536f;
          color: #d4deea;
        }
        .metric-card {
          border: 1px solid #223248;
          border-radius: 2px;
          background: #0f1724;
          padding: 10px;
        }
      `}</style>

      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />

      <div className="terminal-shell overflow-hidden">
        <div className="terminal-bar px-4 md:px-5 py-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1" style={{ color: '#e6edf6' }}>
            Trading Intelligence Terminal
          </h1>
          <p className="text-xs md:text-sm font-mono" style={{ color: '#8fa3ba' }}>
            Admin-only live signal engine with tracked outcomes and real confidence.
          </p>
        </div>

        <section className="p-4 md:p-5 border-b" style={{ borderColor: '#1f2a37' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="terminal-input"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="TICKER (AAPL, SPY...)"
            />

            <select className="terminal-select" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              {STRATEGIES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            <button className="terminal-btn analyze" onClick={() => analyze(symbol)} disabled={loading}>
              {loading ? 'ANALYZING...' : 'ANALYZE'}
            </button>

            <button
              className="terminal-btn logout"
              onClick={async () => {
                await fetch('/api/trading/logout', { method: 'POST' });
                window.location.href = '/trading/login';
              }}
            >
              LOGOUT
            </button>
          </div>

          {error ? (
            <p className="mt-3 text-sm font-mono" style={{ color: '#ff6b81' }}>
              {error}
            </p>
          ) : null}
        </section>

        <section className="p-4 md:p-5">
          {!signal ? (
            <p className="font-mono text-sm" style={{ color: '#8fa3ba' }}>
              Run an analysis to view signal output.
            </p>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-display font-bold mb-3" style={{ color: '#f3f7fc' }}>
                {signal.symbol} — {signal.profileName}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Metric label="Action" value={signal.action} accent={signal.action === 'BUY' ? '#00ff88' : signal.action === 'SELL' ? '#ff5b7f' : '#ffd166'} />
                <Metric label="Entry" value={fp(signal.entryPrice)} />
                <Metric label="Stop" value={fp(signal.stopLoss)} />
                <Metric label="Target" value={fp(signal.targetPrice)} />
              </div>

              <div className="mb-4 p-3 rounded-sm" style={{ border: '1px solid #223248', background: '#0f1724' }}>
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: '#8fa3ba' }}>
                  Win Rate: {signal.winRate}% (n={signal.sampleSize})
                </div>
                <div className="text-lg md:text-xl font-display font-bold" style={{ color: '#e6edf6' }}>
                  Confidence: {signal.confidence}%
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Metric label="RSI" value={signal.indicators?.rsi} />
                <Metric label="MACD Hist" value={signal.indicators?.macdHist} />
                <Metric label="ATR %" value={((signal.indicators?.atr / signal.entryPrice) * 100 || 0).toFixed(2) + '%'} />
                <Metric label="Vol Ratio" value={`${signal.indicators?.volRatio || 0}x`} />
              </div>

              <h3 className="text-xs md:text-sm font-mono uppercase tracking-widest mb-2" style={{ color: '#8fa3ba' }}>
                Signal Reasoning
              </h3>
              <ul className="font-mono text-sm" style={{ color: '#b8c6d9', lineHeight: 1.8, paddingLeft: '18px' }}>
                {(signal.reasons || []).slice(0, 5).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div className="metric-card">
      <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: '#8fa3ba' }}>{label}</div>
      <div className="text-sm md:text-base font-display font-bold" style={{ color: accent || '#e6edf6' }}>{value ?? '—'}</div>
    </div>
  );
}
