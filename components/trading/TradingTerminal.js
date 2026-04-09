import { useCallback, useEffect, useMemo, useState } from 'react';

const STRATEGIES = [
  {
    value: 'momentum',
    label: 'Momentum',
    summary: 'RSI + MACD + moving-average confirmation.',
  },
  {
    value: 'mean_reversion',
    label: 'Mean Reversion',
    summary: 'Bollinger extremes and oversold / overbought reversals.',
  },
  {
    value: 'breakout',
    label: 'Breakout',
    summary: 'Volume expansion and ATR-driven continuation setups.',
  },
  {
    value: 'volatility',
    label: 'Volatility',
    summary: 'Volatility regime and direction-aware options bias.',
  },
];

const STARTING_BALANCE = 100000;

function formatPrice(value) {
  return value == null || Number.isNaN(Number(value)) ? '—' : `$${Number(value).toFixed(2)}`;
}

function formatPercent(value) {
  return value == null || Number.isNaN(Number(value)) ? '—' : `${Number(value).toFixed(2)}%`;
}

function getSignalTone(action) {
  if (action === 'BUY') return 'buy';
  if (action === 'SELL') return 'sell';
  return 'hold';
}

function getScannerRegime(scannerSignals = []) {
  if (!scannerSignals.length) {
    return {
      label: 'Scanner idle',
      tone: 'hold',
      description: 'No stored scanner signals are available yet for today.',
    };
  }

  const buyCount = scannerSignals.filter((signal) => signal.action === 'BUY').length;
  const sellCount = scannerSignals.filter((signal) => signal.action === 'SELL').length;

  if (buyCount > sellCount) {
    return {
      label: 'Bullish scanner tilt',
      tone: 'buy',
      description: `${buyCount} buy signals vs ${sellCount} sell signals in the latest stored scan.`,
    };
  }

  if (sellCount > buyCount) {
    return {
      label: 'Bearish scanner tilt',
      tone: 'sell',
      description: `${sellCount} sell signals vs ${buyCount} buy signals in the latest stored scan.`,
    };
  }

  return {
    label: 'Balanced scanner tilt',
    tone: 'hold',
    description: `Scanner is evenly split with ${buyCount} buy and ${sellCount} sell signals.`,
  };
}

function getRiskReward(entryPrice, stopLoss, targetPrice) {
  const risk = Math.abs(Number(entryPrice) - Number(stopLoss));
  const reward = Math.abs(Number(targetPrice) - Number(entryPrice));
  if (!risk || Number.isNaN(risk) || Number.isNaN(reward)) return '—';
  return `${(reward / risk).toFixed(1)}:1`;
}

function getPnl(position, currentPrice) {
  const livePrice = Number(currentPrice ?? position.entryPrice);
  if (Number.isNaN(livePrice)) return 0;
  return position.direction === 'BUY'
    ? (livePrice - position.entryPrice) * position.shares
    : (position.entryPrice - livePrice) * position.shares;
}

function toScannerSignal(row = {}) {
  return {
    symbol: row.symbol,
    strategy: row.strategy || 'momentum',
    action: row.action || 'HOLD',
    confidence: row.confidence || row.rawConfidence || 0,
    winRate: null,
    sampleSize: 0,
    avgReturn: 0,
    entryPrice: row.entryPrice,
    stopLoss: row.stopLoss,
    targetPrice: row.targetPrice,
    indicators: row.indicators || {},
    reasons: row.reasons || [],
    profileName: `${row.symbol || 'Ticker'} · scanner snapshot`,
    scoreBreakdown: row.scoreBreakdown || null,
    source: 'scanner',
  };
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="surface-muted p-4">
      <div className="eyebrow mb-2" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="text-lg md:text-xl font-display font-semibold" style={{ color: accent || 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

export default function TradingTerminal() {
  const [symbol, setSymbol] = useState('AAPL');
  const [strategy, setStrategy] = useState('momentum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signal, setSignal] = useState(null);
  const [latestPrices, setLatestPrices] = useState({});
  const [scannerSignals, setScannerSignals] = useState([]);
  const [scannerMeta, setScannerMeta] = useState({ status: 'Loading stored scanner results…', generatedAt: null, scanned: null });
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('positions');

  const loadScannerSignals = useCallback(async (options = {}) => {
    const { refresh = false } = options;

    setScannerMeta((prev) => ({
      ...prev,
      status: refresh ? 'Refreshing live scanner results…' : 'Loading scanner results…',
    }));

    try {
      const response = await fetch(`/api/trading/scan-results${refresh ? '?refresh=1' : ''}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No scanner results available');
      }

      const rows = Array.isArray(payload.topSignals) ? payload.topSignals : [];
      setScannerSignals(rows);
      setScannerMeta({
        status: rows.length
          ? payload.source === 'live'
            ? 'Live scanner results refreshed'
            : 'Stored scanner results loaded'
          : 'Scanner returned zero live signals for this run',
        generatedAt: payload.generatedAt || null,
        scanned: payload.scanned || null,
      });
    } catch (err) {
      setScannerSignals([]);
      setScannerMeta({
        status: err.message || 'Unable to load scanner results',
        generatedAt: null,
        scanned: null,
      });
    }
  }, []);

  useEffect(() => {
    loadScannerSignals();
  }, [loadScannerSignals]);

  const analyze = useCallback(
    async (target = symbol) => {
      const nextSymbol = target.trim().toUpperCase();
      if (!nextSymbol) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/trading/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: nextSymbol, strategy }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Unable to analyze signal');

        setSignal({ ...payload, source: 'live' });
        setSymbol(nextSymbol);
        setLatestPrices((prev) => ({ ...prev, [nextSymbol]: payload.entryPrice }));
      } catch (err) {
        setError(err.message || 'Unable to analyze signal');
      } finally {
        setLoading(false);
      }
    },
    [strategy, symbol],
  );

  const scannerRegime = useMemo(() => getScannerRegime(scannerSignals), [scannerSignals]);
  const signalTone = getSignalTone(signal?.action);
  const riskReward = signal ? getRiskReward(signal.entryPrice, signal.stopLoss, signal.targetPrice) : '—';

  const realizedPnl = useMemo(() => history.reduce((sum, trade) => sum + trade.pnl, 0), [history]);
  const unrealizedPnl = useMemo(
    () => positions.reduce((sum, position) => sum + getPnl(position, latestPrices[position.symbol]), 0),
    [positions, latestPrices],
  );
  const portfolioValue = STARTING_BALANCE + realizedPnl + unrealizedPnl;
  const winRate = history.length ? (history.filter((trade) => trade.pnl > 0).length / history.length) * 100 : null;

  function previewScannerSignal(row) {
    const preview = toScannerSignal(row);
    setSignal(preview);
    setSymbol(preview.symbol || '');
    setStrategy(preview.strategy || 'momentum');
    setError('');
  }

  function openPaperTrade(direction) {
    if (!signal?.entryPrice) return;

    const shares = Math.max(1, Math.floor((STARTING_BALANCE * 0.05) / signal.entryPrice));
    const position = {
      id: `${signal.symbol}-${Date.now()}-${direction}`,
      symbol: signal.symbol,
      direction,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      targetPrice: signal.targetPrice,
      shares,
      confidence: signal.confidence,
      openedAt: new Date().toISOString(),
    };

    setPositions((prev) => [position, ...prev].slice(0, 8));
    setActiveTab('positions');
  }

  function closePaperTrade(positionId) {
    setPositions((prev) => {
      const current = prev.find((position) => position.id === positionId);
      if (!current) return prev;

      const livePrice = latestPrices[current.symbol] || current.entryPrice;
      const pnl = getPnl(current, livePrice);

      setHistory((existing) => [
        {
          ...current,
          exitPrice: livePrice,
          pnl,
          closedAt: new Date().toISOString(),
        },
        ...existing,
      ].slice(0, 20));

      return prev.filter((position) => position.id !== positionId);
    });
    setActiveTab('history');
  }

  async function handleLogout() {
    await fetch('/api/trading/logout', { method: 'POST' }).catch(() => null);
    window.location.href = '/trading/login';
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <style jsx>{`
        .terminal-grid {
          display: grid;
          gap: 16px;
        }
        .ticker-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          background: rgba(4, 11, 22, 0.72);
        }
        .ticker-chip {
          flex: 0 0 auto;
          min-width: 140px;
          border: 1px solid rgba(138, 171, 214, 0.14);
          border-radius: 14px;
          background: rgba(8, 17, 29, 0.72);
          padding: 10px 12px;
        }
        .strategy-card {
          border: 1px solid rgba(138, 171, 214, 0.16);
          border-radius: 18px;
          background: rgba(10, 18, 31, 0.82);
          padding: 14px;
          text-align: left;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .strategy-card:hover {
          transform: translateY(-2px);
          border-color: rgba(120, 195, 255, 0.38);
        }
        .strategy-card.active {
          border-color: rgba(120, 195, 255, 0.6);
          box-shadow: 0 0 0 1px rgba(120, 195, 255, 0.12);
          background: linear-gradient(180deg, rgba(15, 31, 54, 0.92), rgba(10, 20, 35, 0.9));
        }
        .status-pill,
        .signal-pill,
        .tab-btn,
        .terminal-button {
          border-radius: 999px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(138, 171, 214, 0.18);
          background: rgba(8, 17, 29, 0.72);
        }
        .status-pill.buy,
        .signal-pill.buy {
          color: #74f0b4;
          border-color: rgba(88, 224, 172, 0.4);
          background: rgba(19, 49, 38, 0.7);
        }
        .status-pill.sell,
        .signal-pill.sell {
          color: #ff8ea4;
          border-color: rgba(255, 107, 138, 0.38);
          background: rgba(56, 18, 28, 0.72);
        }
        .status-pill.hold,
        .signal-pill.hold {
          color: #cbe2ff;
          border-color: rgba(138, 171, 214, 0.22);
          background: rgba(10, 19, 32, 0.72);
        }
        .signal-pill {
          display: inline-flex;
          align-items: center;
          padding: 9px 14px;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .confidence-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(138, 171, 214, 0.16);
          overflow: hidden;
        }
        .confidence-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #4aa6ff, #74f0b4);
          transition: width 0.35s ease;
        }
        .terminal-button {
          border: 1px solid rgba(138, 171, 214, 0.2);
          padding: 11px 16px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: transform 0.18s ease, filter 0.18s ease, border-color 0.18s ease;
        }
        .terminal-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }
        .terminal-button.primary {
          background: linear-gradient(135deg, rgba(88, 183, 255, 0.96), rgba(119, 209, 255, 0.86));
          color: #07111f;
          border-color: rgba(120, 195, 255, 0.35);
        }
        .terminal-button.ghost {
          background: rgba(9, 18, 31, 0.62);
          color: var(--ink);
        }
        .terminal-button.buy {
          background: rgba(19, 49, 38, 0.85);
          color: #74f0b4;
          border-color: rgba(88, 224, 172, 0.4);
        }
        .terminal-button.sell {
          background: rgba(56, 18, 28, 0.82);
          color: #ff9fb1;
          border-color: rgba(255, 107, 138, 0.36);
        }
        .tab-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .tab-btn {
          flex: 1;
          border: 1px solid rgba(138, 171, 214, 0.16);
          background: rgba(9, 18, 31, 0.62);
          color: var(--muted);
          padding: 10px 12px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .tab-btn.active {
          color: var(--ink);
          border-color: rgba(120, 195, 255, 0.35);
          background: linear-gradient(180deg, rgba(15, 29, 49, 0.96), rgba(9, 18, 31, 0.96));
        }
        .scroll-list {
          max-height: 520px;
          overflow-y: auto;
        }
        @media (min-width: 1280px) {
          .terminal-grid {
            grid-template-columns: 290px minmax(0, 1fr) 300px;
          }
        }
      `}</style>

      <div className="surface-panel overflow-hidden">
        <div className="p-4 md:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow mb-3">Native trading intelligence terminal</div>
              <h1 className="text-3xl md:text-5xl font-display font-semibold mb-3" style={{ lineHeight: 1.05 }}>
                Native signal engine, scanner-first workflow.
              </h1>
              <p className="max-w-3xl" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                The iframe shell is gone. This terminal now surfaces stored scanner signals first, then lets you run live single-symbol analysis on demand so Finnhub usage stays much lighter.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <span className={`status-pill ${scannerRegime.tone}`}>{scannerRegime.label}</span>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                {scannerRegime.description}
              </div>
              <button type="button" className="terminal-button ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>

        <div className="ticker-strip">
          {scannerSignals.length ? (
            scannerSignals.slice(0, 8).map((row) => (
              <button
                key={`${row.symbol}-${row.strategy}`}
                type="button"
                className="ticker-chip text-left"
                onClick={() => previewScannerSignal(row)}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--gold-light)' }}>
                    {row.symbol}
                  </span>
                  <span style={{ color: row.action === 'BUY' ? 'var(--green)' : row.action === 'SELL' ? 'var(--red)' : 'var(--muted)' }}>
                    {row.action}
                  </span>
                </div>
                <div className="text-sm font-semibold">{formatPrice(row.entryPrice)}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  Confidence {row.confidence}%
                </div>
              </button>
            ))
          ) : (
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {scannerMeta.status}
            </div>
          )}
        </div>

        <div className="terminal-grid p-4 md:p-6">
          <aside className="order-2 xl:order-1 space-y-4">
            <div className="surface-card p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="eyebrow">Latest scanner signals</div>
                <button type="button" className="terminal-button ghost" onClick={() => loadScannerSignals({ refresh: true })}>
                  Refresh list
                </button>
              </div>

              <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                {scannerMeta.status}
                {scannerMeta.generatedAt ? ` · Generated ${new Date(scannerMeta.generatedAt).toLocaleString()}` : ''}
                {scannerMeta.scanned ? ` · Universe ${scannerMeta.scanned}` : ''}
              </div>

              <div className="scroll-list space-y-2">
                {scannerSignals.length ? (
                  scannerSignals.slice(0, 12).map((row) => (
                    <button
                      key={`${row.symbol}-${row.strategy}-${row.generatedAt || ''}`}
                      type="button"
                      onClick={() => previewScannerSignal(row)}
                      className="w-full text-left surface-muted p-3"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="font-semibold">{row.symbol}</div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>
                            {row.strategy?.replace('_', ' ')}
                          </div>
                        </div>
                        <span className={`status-pill ${getSignalTone(row.action)}`}>{row.action}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span style={{ color: 'var(--muted)' }}>Confidence {row.confidence}%</span>
                        <span>{formatPrice(row.entryPrice)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    No stored signals yet. The daily scanner writes to `site_content` under `daily_signals_scan_YYYY-MM-DD`.
                  </p>
                )}
              </div>
            </div>

            <div className="surface-card p-4 md:p-5">
              <div className="eyebrow mb-3">How the scanner works</div>
              <div className="space-y-3 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
                <p>
                  `lib/trading/scanner.js` loops through the tracked universe, runs `generateSignal()` for each ticker, filters out HOLDs, then sorts by confidence.
                </p>
                <p>
                  Those results are stored via `pages/api/trading/scan-results.js` in `site_content` using the daily key pattern.
                </p>
                <p>
                  The native terminal now reads those stored results first, so you can see scanner output without immediately hammering Finnhub.
                </p>
              </div>
            </div>
          </aside>

          <section className="order-1 xl:order-2 space-y-4">
            <div className="surface-card p-4 md:p-5">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] mb-4">
                <input
                  type="text"
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                  placeholder="Enter ticker (AAPL, NVDA, SPY...)"
                />
                <button
                  type="button"
                  className="terminal-button primary"
                  onClick={() => analyze(symbol)}
                  disabled={loading}
                >
                  {loading ? 'Analyzing…' : 'Run live analysis'}
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {STRATEGIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`strategy-card ${strategy === item.value ? 'active' : ''}`}
                    onClick={() => setStrategy(item.value)}
                  >
                    <div className="eyebrow mb-2">Strategy</div>
                    <div className="font-display text-xl font-semibold mb-2">{item.label}</div>
                    <div className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                      {item.summary}
                    </div>
                  </button>
                ))}
              </div>

              {error ? (
                <p className="mt-4 text-sm" style={{ color: '#ff95a8' }}>
                  {error}
                </p>
              ) : null}
            </div>

            {signal ? (
              <div className="surface-panel p-5 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
                  <div>
                    <div className="eyebrow mb-3">{signal.source === 'scanner' ? 'Scanner snapshot' : 'Live analysis'}</div>
                    <h2 className="text-3xl md:text-4xl font-display font-semibold mb-2">
                      {signal.symbol}
                    </h2>
                    <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                      {signal.profileName}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    <span className={`signal-pill ${signalTone}`}>{signal.action}</span>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                      Strategy: {(signal.strategy || strategy).replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="surface-muted p-4 md:p-5 mb-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
                    <div>
                      <div className="eyebrow mb-2" style={{ color: 'var(--muted)' }}>Confidence</div>
                      <div className="text-2xl font-display font-semibold">{signal.confidence || signal.rawConfidence || 0}%</div>
                    </div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                      {signal.source === 'live'
                        ? `Win rate ${signal.winRate == null ? '—' : `${signal.winRate}%`} · Sample ${signal.sampleSize ?? 0} · Avg return ${signal.avgReturn == null ? '—' : formatPercent(signal.avgReturn)}`
                        : 'Stored scanner signal — use live analysis to refresh with current quote + tracked stats.'}
                    </div>
                  </div>
                  <div className="confidence-track">
                    <div className="confidence-fill" style={{ width: `${signal.confidence || signal.rawConfidence || 0}%` }} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
                  <MetricCard label="Entry" value={formatPrice(signal.entryPrice)} accent="var(--gold-light)" />
                  <MetricCard label="Stop loss" value={formatPrice(signal.stopLoss)} accent="#ff95a8" />
                  <MetricCard label="Target" value={formatPrice(signal.targetPrice)} accent="#74f0b4" />
                  <MetricCard label="Risk / reward" value={riskReward} accent="var(--ink)" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mb-4">
                  <MetricCard label="RSI" value={signal.indicators?.rsi ?? '—'} />
                  <MetricCard label="MACD histogram" value={signal.indicators?.macdHist ?? '—'} />
                  <MetricCard label="BB %B" value={signal.indicators?.bbPct ?? '—'} />
                  <MetricCard label="Stochastic K" value={signal.indicators?.stochK ?? '—'} />
                  <MetricCard label="ATR %" value={formatPercent(signal.indicators?.atrPct)} />
                  <MetricCard label="Volume ratio" value={signal.indicators?.volRatio ? `${signal.indicators.volRatio}x` : '—'} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
                  <MetricCard label="50 SMA" value={formatPrice(signal.indicators?.sma50)} />
                  <MetricCard label="200 SMA" value={formatPrice(signal.indicators?.sma200)} />
                  <MetricCard label="Volatility proxy" value={formatPercent(signal.indicators?.ivPct)} />
                  <MetricCard
                    label="Score split"
                    value={signal.scoreBreakdown ? `${signal.scoreBreakdown.bull} / ${signal.scoreBreakdown.bear}` : '—'}
                  />
                </div>

                <div className="surface-card p-4 md:p-5 mb-4">
                  <div className="eyebrow mb-3">Signal reasoning</div>
                  <ul className="info-list space-y-3 text-sm" style={{ color: '#d7e6fb', lineHeight: 1.75 }}>
                    {(signal.reasons || []).slice(0, 6).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <button type="button" className="terminal-button buy" onClick={() => openPaperTrade('BUY')}>
                    Paper long
                  </button>
                  <button type="button" className="terminal-button sell" onClick={() => openPaperTrade('SELL')}>
                    Paper short
                  </button>
                  <button type="button" className="terminal-button ghost" onClick={() => analyze(signal.symbol || symbol)} disabled={loading}>
                    Refresh live
                  </button>
                  <button type="button" className="terminal-button ghost" onClick={() => setSignal(null)}>
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="surface-card p-6 md:p-10 text-center">
                <div className="eyebrow mb-3">Ready</div>
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-3">Start from the scanner or analyze manually</h2>
                <p className="max-w-2xl mx-auto" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                  Click a stored scanner signal from the left rail to inspect it instantly, then refresh it live only when you need fresh Finnhub data.
                </p>
              </div>
            )}
          </section>

          <aside className="order-3 space-y-4">
            <div className="surface-card p-4 md:p-5">
              <div className="eyebrow mb-3">Paper desk summary</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <MetricCard label="Portfolio value" value={formatPrice(portfolioValue)} accent={portfolioValue >= STARTING_BALANCE ? '#74f0b4' : '#ff95a8'} />
                <MetricCard label="Realized P&L" value={formatPrice(realizedPnl)} accent={realizedPnl >= 0 ? '#74f0b4' : '#ff95a8'} />
                <MetricCard label="Unrealized P&L" value={formatPrice(unrealizedPnl)} accent={unrealizedPnl >= 0 ? '#74f0b4' : '#ff95a8'} />
                <MetricCard label="Win rate" value={winRate == null ? '—' : `${winRate.toFixed(0)}%`} />
              </div>
            </div>

            <div className="surface-card p-4 md:p-5">
              <div className="tab-row">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'positions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('positions')}
                >
                  Positions
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
              </div>

              {activeTab === 'positions' ? (
                <div className="scroll-list space-y-3">
                  {positions.length ? (
                    positions.map((position) => {
                      const currentPrice = latestPrices[position.symbol] || position.entryPrice;
                      const pnl = getPnl(position, currentPrice);
                      return (
                        <div key={position.id} className="surface-muted p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="font-semibold">{position.symbol}</div>
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                {position.direction} · {position.shares} shares
                              </div>
                            </div>
                            <div className="text-right">
                              <div style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPrice(pnl)}</div>
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                Entry {formatPrice(position.entryPrice)}
                              </div>
                            </div>
                          </div>
                          <button type="button" className="terminal-button ghost w-full" onClick={() => closePaperTrade(position.id)}>
                            Close position
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      No open paper positions.
                    </p>
                  )}
                </div>
              ) : (
                <div className="scroll-list space-y-3">
                  {history.length ? (
                    history.map((trade) => (
                      <div key={trade.id} className="surface-muted p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="font-semibold">{trade.symbol}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>
                              {trade.direction} · {trade.shares} shares
                            </div>
                          </div>
                          <div className="text-right">
                            <div style={{ color: trade.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPrice(trade.pnl)}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>
                              Exit {formatPrice(trade.exitPrice)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>
                          Closed {new Date(trade.closedAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      No paper trade history yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
