import { useMemo, useState } from 'react';

const WATCHLIST = [
  { sym: 'SPY', name: 'S&P 500 ETF' },
  { sym: 'QQQ', name: 'Nasdaq 100 ETF' },
  { sym: 'AAPL', name: 'Apple Inc' },
  { sym: 'NVDA', name: 'Nvidia Corp' },
  { sym: 'TSLA', name: 'Tesla Inc' },
  { sym: 'AMZN', name: 'Amazon.com' },
  { sym: 'META', name: 'Meta Platforms' },
  { sym: 'MSFT', name: 'Microsoft Corp' },
];

const fp = (p) => (p == null ? '—' : `$${Number(p).toFixed(2)}`);

function calcRSI(closes, n = 14) {
  if (closes.length < n + 1) return 50;
  let g = 0;
  let l = 0;
  for (let i = closes.length - n; i < closes.length; i += 1) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) g += d;
    else l -= d;
  }
  const rs = g / (l || 1e-9);
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

function calcEMA(arr, n) {
  const k = 2 / (n + 1);
  let e = arr[0];
  for (let i = 1; i < arr.length; i += 1) e = arr[i] * k + e * (1 - k);
  return e;
}

function calcMACD(closes) {
  if (closes.length < 26) return { hist: 0 };
  const ema12 = calcEMA(closes.slice(-12), 12);
  const ema26 = calcEMA(closes.slice(-26), 26);
  const line = ema12 - ema26;
  const series = [];
  for (let i = 26; i <= closes.length; i += 1) {
    const e12 = calcEMA(closes.slice(i - 12, i), 12);
    const e26 = calcEMA(closes.slice(i - 26, i), 26);
    series.push(e12 - e26);
  }
  const sig = series.length >= 9 ? calcEMA(series.slice(-9), 9) : line;
  return { macd: line, signal: sig, hist: +(line - sig).toFixed(4) };
}

function calcBB(closes, n = 20) {
  if (closes.length < n) return 0.5;
  const s = closes.slice(-n);
  const mean = s.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(s.map((x) => (x - mean) ** 2).reduce((a, b) => a + b, 0) / n);
  if (std === 0) return 0.5;
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  return +((closes[closes.length - 1] - lower) / (upper - lower)).toFixed(3);
}

function calcStoch(h, l, c, n = 14) {
  if (c.length < n) return 50;
  const hh = Math.max(...h.slice(-n));
  const ll = Math.min(...l.slice(-n));
  return hh === ll ? 50 : +(((c[c.length - 1] - ll) / (hh - ll)) * 100).toFixed(1);
}

function calcATR(h, l, c, n = 14) {
  const trs = [];
  for (let i = Math.max(1, c.length - n); i < c.length; i += 1) {
    trs.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])));
  }
  return trs.length ? trs.reduce((a, b) => a + b, 0) / trs.length : c[c.length - 1] * 0.015;
}

function calcVolRatio(v) {
  if (v.length < 20) return 1;
  const avg = v.slice(-20).reduce((a, b) => a + b, 0) / 20;
  return avg === 0 ? 1 : +(v[v.length - 1] / avg).toFixed(2);
}

function score(inds) {
  let bull = 0;
  let bear = 0;
  const reasons = [];

  if (inds.rsi > 50 && inds.rsi < 70) {
    bull += 25;
    reasons.push(`RSI ${inds.rsi} bullish momentum`);
  } else if (inds.rsi < 45 && inds.rsi > 30) {
    bear += 20;
    reasons.push(`RSI ${inds.rsi} bearish momentum`);
  }

  if (inds.macdHist > 0.01) {
    bull += 25;
    reasons.push(`MACD histogram +${inds.macdHist.toFixed(3)} bullish`);
  } else if (inds.macdHist < -0.01) {
    bear += 25;
    reasons.push(`MACD histogram ${inds.macdHist.toFixed(3)} bearish`);
  }

  if (inds.volRatio > 1.5) {
    bull += 12;
    reasons.push(`Volume ${inds.volRatio}x avg`);
  }

  const net = bull - bear;
  if (Math.abs(net) < 30) return { action: 'HOLD', confidence: 55, reasons };
  if (net > 0) return { action: 'BUY', confidence: Math.min(95, 50 + bull * 0.55), reasons };
  return { action: 'SELL', confidence: Math.min(95, 50 + bear * 0.55), reasons };
}

export default function TradingTerminal() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signal, setSignal] = useState(null);

  const title = useMemo(() => `${symbol || 'Ticker'} Trading Signal`, [symbol]);

  async function proxy(endpoint, params = {}) {
    const query = new URLSearchParams({ endpoint, ...params }).toString();
    const response = await fetch(`/api/trading/finnhub?${query}`);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }

  async function analyze(targetSymbol = symbol) {
    const sym = targetSymbol.trim().toUpperCase();
    if (!sym) return;

    setLoading(true);
    setError('');

    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 120 * 86400;

      const [quote, candles, profile] = await Promise.all([
        proxy('quote', { symbol: sym }),
        proxy('candle', { symbol: sym, resolution: 'D', from: String(from), to: String(to) }),
        proxy('profile2', { symbol: sym }),
      ]);

      if (!quote || !quote.c) throw new Error('Symbol not found');
      if (!candles || candles.s !== 'ok' || !candles.c || candles.c.length < 20) {
        throw new Error('Not enough candle data');
      }

      const closes = [...candles.c];
      closes[closes.length - 1] = quote.c;

      const inds = {
        rsi: calcRSI(closes),
        macdHist: calcMACD(closes).hist,
        bbPct: calcBB(closes),
        stochK: calcStoch(candles.h, candles.l, closes),
        atr: calcATR(candles.h, candles.l, closes),
        volRatio: calcVolRatio(candles.v),
      };

      const scored = score(inds);
      setSignal({
        sym,
        name: profile?.name || sym,
        quote,
        inds,
        ...scored,
      });
      setSymbol(sym);
    } catch (e) {
      setError(e.message || 'Unable to analyze symbol');
      setSignal(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />

      <h1 className="text-4xl font-display font-bold mb-2">Trading Intelligence</h1>
      <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
        Live signal dashboard for admin users. Powered by Finnhub via secure server proxy.
      </p>

      <section style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '18px' }} className="mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter ticker (AAPL, SPY, TSLA...)"
          />
          <button
            onClick={() => analyze(symbol)}
            disabled={loading}
            style={{ background: 'var(--ink)', color: 'var(--gold)', border: 'none', padding: '10px 20px', borderRadius: '2px', fontWeight: 'bold' }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            onClick={async () => {
              await fetch('/api/trading/logout', { method: 'POST' });
              window.location.href = '/trading/login';
            }}
            style={{ background: 'white', color: 'var(--ink)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '2px', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>
        {error ? <p className="mt-3" style={{ color: 'var(--red)' }}>{error}</p> : null}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }} className="mb-8">
        {WATCHLIST.map((item) => (
          <button
            key={item.sym}
            onClick={() => analyze(item.sym)}
            style={{ textAlign: 'left', background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '12px' }}
          >
            <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--gold)' }}>{item.sym}</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>{item.name}</div>
          </button>
        ))}
      </section>

      <section style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '18px' }}>
        <h2 className="text-2xl font-display font-bold mb-4">{title}</h2>
        {signal ? (
          <>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div><div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Price</div><div className="text-2xl font-display font-bold">{fp(signal.quote.c)}</div></div>
              <div><div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Signal</div><div className="text-2xl font-display font-bold" style={{ color: signal.action === 'BUY' ? 'var(--green)' : signal.action === 'SELL' ? 'var(--red)' : 'var(--gold)' }}>{signal.action}</div></div>
              <div><div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Confidence</div><div className="text-2xl font-display font-bold">{Math.round(signal.confidence)}%</div></div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div><div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>RSI</div><div>{signal.inds.rsi}</div></div>
              <div><div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>MACD Hist</div><div>{signal.inds.macdHist}</div></div>
              <div><div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Vol Ratio</div><div>{signal.inds.volRatio}x</div></div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Signal rationale</div>
              <ul style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                {signal.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--muted)' }}>Run an analysis to view live signal output.</p>
        )}
      </section>
    </main>
  );
}
