import { buildDailySignals } from './daily';
import { getSignalStats } from './db';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export async function getDailySignalsReport() {
  const rawSignals = await buildDailySignals();

  const enriched = [];
  for (const signal of rawSignals) {
    const stats = await getSignalStats(signal.symbol, signal.strategy);
    const confidence = Math.round(clamp(stats.win_rate, 40, 90));

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
  const selected = enriched.slice(0, 5);

  return {
    signals: selected,
    generatedAt: new Date().toISOString(),
  };
}
