import { getSignalStats, getSiteContent, upsertSiteContent } from './db';
import { compareRankedSignals, rankTradingSignal } from './ranking';
import { runDailyScanner } from './scanner';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function emailCount() {
  const parsed = Number(process.env.TRADING_TOP_SIGNAL_COUNT || process.env.DAILY_SIGNALS_EMAIL_COUNT || '10');
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return Math.max(1, Math.min(10, Math.floor(parsed)));
}

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrBuildDailyScan() {
  const key = `daily_signals_scan_${utcDateKey()}`;
  const existing = await getSiteContent(key);

  if (existing?.content && Array.isArray(existing.content.topSignals)) {
    return { key, scan: existing.content };
  }

  const scan = await runDailyScanner({ strategy: 'momentum' });
  await upsertSiteContent(key, scan);
  return { key, scan };
}

export async function getDailySignalsReport() {
  const { scan } = await getOrBuildDailyScan();
  const rawSignals = Array.isArray(scan?.topSignals) ? scan.topSignals : [];

  const enriched = [];
  for (const signal of rawSignals) {
    const stats = await getSignalStats(signal.symbol, signal.strategy || 'momentum');
    const hasWinRate = Number.isFinite(Number(stats.win_rate));
    const statsConfidence = hasWinRate ? Math.round(clamp(Number(stats.win_rate), 40, 90)) : 0;
    const confidence = Math.max(signal.confidence || 0, statsConfidence);

    if (confidence < 60) continue;
    if (signal.action === 'HOLD') continue;

    const enrichedSignal = {
      ...signal,
      confidence,
      winRate: hasWinRate ? Math.round(Number(stats.win_rate) * 10) / 10 : null,
      sampleSize: Number(stats.sample_size) || 0,
      avgReturn: Number.isFinite(Number(stats.avg_return)) ? Math.round(Number(stats.avg_return) * 100) / 100 : null,
    };

    enrichedSignal.rankingScore = rankTradingSignal(enrichedSignal);
    enriched.push(enrichedSignal);
  }

  enriched.sort(compareRankedSignals);

  let selected = enriched.slice(0, emailCount());

  if (selected.length < emailCount()) {
    const seen = new Set(selected.map((s) => `${s.symbol}:${s.strategy}:${s.action}`));
    const fallback = rawSignals
      .filter((s) => s.action !== 'HOLD')
      .filter((s) => !seen.has(`${s.symbol}:${s.strategy || 'momentum'}:${s.action}`))
      .map((s) => {
        const candidate = {
          ...s,
          confidence: s.confidence || 50,
          winRate: null,
          sampleSize: 0,
          avgReturn: null,
        };
        return {
          ...candidate,
          rankingScore: rankTradingSignal(candidate),
        };
      })
      .sort(compareRankedSignals);

    selected = [...selected, ...fallback].slice(0, emailCount());
  }

  return {
    signals: selected,
    generatedAt: scan?.generatedAt || new Date().toISOString(),
    scanned: scan?.scanned || 0,
    universeName: scan?.universeName || process.env.TRADING_SCANNER_UNIVERSE || 'curated_100',
  };
}
