import { fetchCandles, fetchProfile, fetchQuote } from '../../../lib/trading/finnhub';

function buildPath(endpoint, query) {
  if (endpoint === 'quote') {
    return `/quote?symbol=${encodeURIComponent(query.symbol || '')}`;
  }

  if (endpoint === 'profile2') {
    return `/stock/profile2?symbol=${encodeURIComponent(query.symbol || '')}`;
  }

  if (endpoint === 'candle') {
    const symbol = encodeURIComponent(query.symbol || '');
    const resolution = encodeURIComponent(query.resolution || 'D');
    const from = encodeURIComponent(query.from || '');
    const to = encodeURIComponent(query.to || '');
    return `/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`;
  }

  return null;
}

export default async function handler(req, res) {
  const endpoint = req.query.endpoint;
  const path = buildPath(endpoint, req.query);
  if (!path) {
    return res.status(400).json({ error: 'Unsupported endpoint' });
  }

  try {
    let payload;

    if (endpoint === 'quote') {
      payload = await fetchQuote(req.query.symbol || '');
    } else if (endpoint === 'profile2') {
      payload = await fetchProfile(req.query.symbol || '');
    } else if (endpoint === 'candle') {
      payload = await fetchCandles(
        req.query.symbol || '',
        req.query.resolution || 'D',
        req.query.from || '',
        req.query.to || '',
      );
    }

    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
    return res.status(200).json(payload);
  } catch (error) {
    const message = error.message || 'Unexpected Finnhub proxy error';
    const match = message.match(/Finnhub error \((\d+)\):\s*(.*)$/);
    if (match) {
      return res.status(Number(match[1])).json({ error: match[2] || 'Finnhub request failed' });
    }
    return res.status(500).json({ error: message });
  }
}
