import { generateSignal } from '../../../lib/trading/engine';
import { getSignalStats, insertTradingSignal } from '../../../lib/trading/db';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, strategy = 'momentum' } = req.body || {};
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'symbol is required' });
    }

    const signal = await generateSignal(symbol, strategy);
    await insertTradingSignal(signal);
    const stats = await getSignalStats(signal.symbol, signal.strategy);

    const confidence = Math.round(clamp(stats.win_rate, 40, 90));

    return res.status(200).json({
      ...signal,
      confidence,
      winRate: Math.round(stats.win_rate * 10) / 10,
      sampleSize: stats.sample_size,
      avgReturn: Math.round(stats.avg_return * 100) / 100,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to analyze signal' });
  }
}
