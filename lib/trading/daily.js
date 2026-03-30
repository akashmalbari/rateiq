import { generateSignal } from './engine';

export const DAILY_TICKERS = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA', 'AMZN', 'META'];

export async function buildDailySignals() {
  const candidates = [];

  for (const symbol of DAILY_TICKERS) {
    try {
      const signal = await generateSignal(symbol, 'momentum');
      const atrPct = (signal.indicators.atr / signal.entryPrice) * 100;
      if (atrPct < 1) continue;
      if (signal.indicators.volRatio < 1) continue;
      candidates.push({ ...signal, atrPct });
    } catch {
      // ignore individual failures
    }
  }

  return candidates;
}
