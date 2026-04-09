import { getSessionFromRequest, hasTradingAccess } from '../../../lib/trading/auth';
import { getSignalStats, insertTradingSignal } from '../../../lib/trading/db';
import { generateSignal } from '../../../lib/trading/engine';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSessionFromRequest(req);
  if (!hasTradingAccess(session)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { symbol, strategy = 'momentum' } = req.body || {};
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'symbol is required' });
    }

    const signal = await generateSignal(symbol, strategy);

    let confidence = signal.rawConfidence;
    let winRate = null;
    let sampleSize = 0;
    let avgReturn = null;

    try {
      await insertTradingSignal(signal);
      const stats = await getSignalStats(signal.symbol, signal.strategy);
      confidence = Math.max(signal.rawConfidence, Math.round(clamp(stats.win_rate, 40, 90)));
      winRate = Math.round(stats.win_rate * 10) / 10;
      sampleSize = stats.sample_size;
      avgReturn = Math.round(stats.avg_return * 100) / 100;
    } catch (dbError) {
      console.warn('[api/trading/analyze] continuing without DB stats', dbError);
    }

    return res.status(200).json({
      ...signal,
      confidence,
      winRate,
      sampleSize,
      avgReturn,
    });
  } catch (error) {
    const message = error.message || 'Failed to analyze signal';
    if (message.includes('Finnhub error (403)')) {
      return res.status(502).json({
        error:
          'Finnhub rejected the request (403). Verify FINNHUB_API_KEY on Vercel/local env, key permissions, and account quota.',
      });
    }
    return res.status(500).json({ error: message });
  }
}
