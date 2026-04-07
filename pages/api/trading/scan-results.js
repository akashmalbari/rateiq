import { getCookieName, parseCookies, verifySessionToken } from '../../../lib/trading/auth';
import { upsertSiteContent } from '../../../lib/trading/db';

function requireAdmin(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[getCookieName()];
  const session = verifySessionToken(token);
  if (!session || session.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { results = [], scanned = 0, withCandles = 0, quoteOnly = 0, failed = 0 } = req.body || {};
    if (!Array.isArray(results)) return res.status(400).json({ error: 'results must be an array' });

    const key = `daily_signals_scan_${todayKey()}`;
    await upsertSiteContent(key, {
      source: 'apex_ui',
      generatedAt: new Date().toISOString(),
      scanned,
      signalCount: results.length,
      withCandles,
      quoteOnly,
      failed,
      topSignals: results,
    });

    return res.status(200).json({ ok: true, key, stored: results.length });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Failed to store scan results' });
  }
}
