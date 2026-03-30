const BASE = 'https://finnhub.io/api/v1';

function getKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('Missing FINNHUB_API_KEY');
  return key;
}

async function finnhub(path) {
  const key = getKey();
  const response = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(key)}`);
  const payload = await response.json();
  if (!response.ok) {
    const reason = payload?.error || payload?.message || 'Unknown Finnhub error';
    throw new Error(`Finnhub error (${response.status}): ${reason}`);
  }
  return payload;
}

export async function fetchQuote(symbol) {
  return finnhub(`/quote?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchProfile(symbol) {
  return finnhub(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchCandles(symbol, resolution = 'D', from, to) {
  return finnhub(`/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${encodeURIComponent(resolution)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}
