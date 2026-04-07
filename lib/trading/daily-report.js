import { getSignalStats, getSiteContent, upsertSiteContent } from './db';
import { runDailyScanner } from './scanner';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function emailCount() {
  const parsed = Number(process.env.DAILY_SIGNALS_EMAIL_COUNT || '30');
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30;
}

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrBuildDailyScan() {
  const key = `daily_signals_scan_${utcDateKey()}`;
  const existing = await getSiteContent(key);
  const existingSignals = existing?.content?.topSignals;
  if (Array.isArray(existingSignals) && existingSignals.length) {
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
    const statsConfidence = Math.round(clamp(stats.win_rate, 40, 90));
    const confidence = Math.max(signal.confidence || 0, statsConfidence);

    if (confidence < 60) continue;
    if (signal.action === 'HOLD') continue;

    enriched.push({
      ...signal,
      confidence,
      winRate: Math.round(stats.win_rate * 10) / 10,
      sampleSize: stats.sample_size,
      avgReturn: Math.round(stats.avg_return * 100) / 100,
    });
  }

  enriched.sort((a, b) => b.confidence - a.confidence);

  let selected = enriched.slice(0, emailCount());

  if (selected.length < emailCount()) {
    const seen = new Set(selected.map((s) => `${s.symbol}:${s.strategy}:${s.action}`));
    const fallback = rawSignals
      .filter((s) => s.action !== 'HOLD')
      .filter((s) => !seen.has(`${s.symbol}:${s.strategy || 'momentum'}:${s.action}`))
      .map((s) => ({
        ...s,
        confidence: s.confidence || 50,
        winRate: null,
        sampleSize: 0,
        avgReturn: 0,
      }));

    selected = [...selected, ...fallback].slice(0, emailCount());
  }

  return {
    signals: selected,
    generatedAt: scan?.generatedAt || new Date().toISOString(),
  };
}
