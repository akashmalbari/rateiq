const BASE = 'https://finnhub.io/api/v1';

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
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Missing FINNHUB_API_KEY' });
  }

  const endpoint = req.query.endpoint;
  const path = buildPath(endpoint, req.query);
  if (!path) {
    return res.status(400).json({ error: 'Unsupported endpoint' });
  }

  try {
    const url = `${BASE}${path}&token=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Finnhub request failed', payload });
    }

    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected Finnhub proxy error' });
  }
}
