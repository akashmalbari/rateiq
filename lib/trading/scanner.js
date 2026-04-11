import { generateSignal } from './engine';
import { compareRankedSignals, rankTradingSignal } from './ranking';
import { getScannerUniverse } from './universe';

function parsePositiveInt(value, fallback, { min = 1, max = 1000 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function scanConcurrency() {
  return parsePositiveInt(process.env.TRADING_SCANNER_CONCURRENCY || '6', 6, { min: 1, max: 20 });
}

function topSignalCount() {
  return parsePositiveInt(process.env.TRADING_TOP_SIGNAL_COUNT || process.env.DAILY_SIGNALS_EMAIL_COUNT || '10', 10, {
    min: 1,
    max: 10,
  });
}

function toScanRow(signal, generatedAt) {
  return {
    symbol: signal.symbol,
    strategy: signal.strategy,
    action: signal.action,
    confidence: signal.rawConfidence,
    rankingScore: rankTradingSignal(signal),
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    targetPrice: signal.targetPrice,
    reasons: signal.reasons || [],
    indicators: signal.indicators || {},
    scoreBreakdown: signal.scoreBreakdown || null,
    profileName: signal.profileName || signal.symbol,
    generatedAt,
  };
}

async function mapWithConcurrency(items, limit, iteratee) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await iteratee(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
}

export async function runDailyScanner({
  strategy = 'momentum',
  universeName = process.env.TRADING_SCANNER_UNIVERSE || 'curated_500',
  topN = topSignalCount(),
  concurrency = scanConcurrency(),
} = {}) {
  const generatedAt = new Date().toISOString();
  const universe = getScannerUniverse(universeName);
  const results = [];
  const failures = [];
  let withCandles = 0;
  let quoteOnly = 0;
  let buyCount = 0;
  let sellCount = 0;
  let holdCount = 0;

  await mapWithConcurrency(universe, concurrency, async (symbol) => {
    try {
      const signal = await generateSignal(symbol, strategy, { includeProfile: false });
      const dataMode = signal?.indicators?.dataMode;

      if (dataMode === 'CANDLES+QUOTE') withCandles += 1;
      else quoteOnly += 1;

      if (signal.action === 'HOLD') {
        holdCount += 1;
        return;
      }

      if (signal.action === 'BUY') buyCount += 1;
      if (signal.action === 'SELL') sellCount += 1;

      results.push(toScanRow(signal, generatedAt));
    } catch (error) {
      failures.push({ symbol, error: error.message || 'scan_failed' });
    }
  });

  const ranked = [...results].sort(compareRankedSignals);
  const topSignals = ranked.slice(0, Math.min(topN, ranked.length));

  return {
    generatedAt,
    strategy,
    universeName,
    scanned: universe.length,
    signalCount: results.length,
    topSignalCount: topSignals.length,
    topSignals,
    withCandles,
    quoteOnly,
    concurrency,
    actionCounts: {
      buy: buyCount,
      sell: sellCount,
      hold: holdCount,
    },
    failures,
  };
}
