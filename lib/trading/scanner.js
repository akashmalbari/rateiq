import { generateSignal } from './engine';

const UNIVERSE_30 = [
  'AAPL','MSFT','NVDA','AMZN','META','GOOGL','TSLA','JPM','V','XOM',
  'UNH','JNJ','PG','MA','HD','BAC','ABBV','MRK','LLY','KO',
  'AVGO','COST','WMT','CSCO','MCD','CRM','NFLX','ADBE','AMD','QCOM',
];

function toScanRow(signal) {
  return {
    symbol: signal.symbol,
    strategy: signal.strategy,
    action: signal.action,
    confidence: signal.rawConfidence,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    targetPrice: signal.targetPrice,
    reasons: signal.reasons || [],
    indicators: signal.indicators || {},
    generatedAt: new Date().toISOString(),
  };
}

export async function runDailyScanner({ strategy = 'momentum' } = {}) {
  const results = [];
  const failures = [];

  for (const symbol of UNIVERSE_30) {
    try {
      const signal = await generateSignal(symbol, strategy);
      if (signal.action === 'HOLD') continue;
      results.push(toScanRow(signal));
    } catch (error) {
      failures.push({ symbol, error: error.message || 'scan_failed' });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);

  return {
    generatedAt: new Date().toISOString(),
    strategy,
    scanned: UNIVERSE_30.length,
    signalCount: results.length,
    topSignals: results.slice(0, 10),
    failures,
  };
}
