const BASE = 'https://finnhub.io/api/v1';
const LEGACY_EMBEDDED_FALLBACK_KEY = 'd75chf9r01qk56kc8v4gd75chf9r01qk56kc8v50';

function getKeys() {
  const keys = [
    process.env.FINNHUB_API_KEY,
    process.env.NEXT_PUBLIC_FINNHUB_API_KEY,
    LEGACY_EMBEDDED_FALLBACK_KEY,
  ].filter(Boolean);

  const unique = [...new Set(keys.map((value) => value.trim()).filter(Boolean))];
  if (!unique.length) throw new Error('Missing FINNHUB_API_KEY');
  return unique;
}

async function readPayload(response) {
  const text = await response.text();
  if (!text || !text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function finnhub(path, { retries = 2 } = {}) {
  const keys = getKeys();
  let lastError = null;

  for (const key of keys) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(key)}`;

      try {
        const response = await fetch(url);
        const payload = await readPayload(response);

        if (response.status === 429 && attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
          continue;
        }

        if (!response.ok) {
          const reason = payload?.error || payload?.message || payload?.raw || 'Unknown Finnhub error';
          lastError = new Error(`Finnhub error (${response.status}): ${reason}`);

          if (response.status === 403) {
            break;
          }

          throw lastError;
        }

        return payload;
      } catch (error) {
        lastError = error;
        if (attempt === retries) break;
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Finnhub request failed');
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
