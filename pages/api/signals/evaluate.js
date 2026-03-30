import { fetchQuote } from '../../../lib/trading/finnhub';
import { getPendingSignals, updateSignalOutcome } from '../../../lib/trading/db';

export default async function handler(req, res) {
  try {
    const hoursOld = Number(req.query.hoursOld || 24);
    const boundedHours = Math.min(72, Math.max(24, Number.isFinite(hoursOld) ? hoursOld : 24));

    const pendingSignals = await getPendingSignals(boundedHours);
    let evaluated = 0;
    let wins = 0;
    let losses = 0;

    for (const signal of pendingSignals || []) {
      try {
        const quote = await fetchQuote(signal.symbol);
        const latest = quote?.c;
        if (!latest) continue;

        let outcome = null;
        if (signal.action === 'BUY') {
          if (latest >= Number(signal.target_price)) outcome = 'WIN';
          if (latest <= Number(signal.stop_loss)) outcome = 'LOSS';
        } else if (signal.action === 'SELL') {
          if (latest <= Number(signal.target_price)) outcome = 'WIN';
          if (latest >= Number(signal.stop_loss)) outcome = 'LOSS';
        }

        if (outcome) {
          await updateSignalOutcome(signal.id, outcome, latest);
          evaluated += 1;
          if (outcome === 'WIN') wins += 1;
          else losses += 1;
        }
      } catch {
        // continue evaluating remaining signals
      }
    }

    return res.status(200).json({
      checked: pendingSignals?.length || 0,
      evaluated,
      wins,
      losses,
      hoursOld: boundedHours,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Evaluation failed' });
  }
}
