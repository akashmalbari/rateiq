import { fetchCandles, fetchProfile, fetchQuote } from './finnhub';

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
  return { hist: +(line - sig).toFixed(4) };
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

function score(inds, strategy = 'momentum') {
  let bull = 0;
  let bear = 0;
  const reasons = [];

  if (strategy === 'momentum') {
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
  }

  const net = bull - bear;
  if (Math.abs(net) < 30) return { action: 'HOLD', rawConfidence: 55, reasons };
  if (net > 0) return { action: 'BUY', rawConfidence: Math.min(95, 50 + bull * 0.55), reasons };
  return { action: 'SELL', rawConfidence: Math.min(95, 50 + bear * 0.55), reasons };
}

export async function generateSignal(symbol, strategy = 'momentum') {
  const sym = symbol.trim().toUpperCase();
  const to = Math.floor(Date.now() / 1000);
  const from = to - 120 * 86400;

  const [quote, candles, profile] = await Promise.all([
    fetchQuote(sym),
    fetchCandles(sym, 'D', from, to),
    fetchProfile(sym),
  ]);

  if (!quote?.c) throw new Error('Symbol not found');
  if (!candles || candles.s !== 'ok' || !candles.c || candles.c.length < 20) {
    throw new Error('Not enough candle data');
  }

  const closes = [...candles.c];
  closes[closes.length - 1] = quote.c;

  const inds = {
    rsi: calcRSI(closes),
    macdHist: calcMACD(closes).hist,
    bbPct: calcBB(closes),
    atr: calcATR(candles.h, candles.l, closes),
    volRatio: calcVolRatio(candles.v),
  };

  const scored = score(inds, strategy);
  const entryPrice = quote.c;
  const stopLoss = scored.action === 'BUY' ? entryPrice - inds.atr * 1.5 : entryPrice + inds.atr * 1.5;
  const targetPrice = scored.action === 'BUY' ? entryPrice + inds.atr * 2 : entryPrice - inds.atr * 2;

  return {
    symbol: sym,
    strategy,
    action: scored.action,
    rawConfidence: Math.round(scored.rawConfidence),
    entryPrice,
    stopLoss,
    targetPrice,
    indicators: inds,
    reasons: scored.reasons,
    profileName: profile?.name || sym,
  };
}
