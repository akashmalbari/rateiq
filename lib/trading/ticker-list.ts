export const MAX_ADMIN_PICK_SYMBOLS = 100;

const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

export function parseTickerList(value: string | string[]) {
  const tokens = (Array.isArray(value) ? value : value.split(/[\s,;]+/))
    .map((token) => token.trim().replace(/^\$/, "").toUpperCase())
    .filter(Boolean);
  const symbols: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (!TICKER_PATTERN.test(token)) {
      if (!invalid.includes(token)) invalid.push(token);
      continue;
    }
    if (seen.has(token)) continue;
    seen.add(token);
    symbols.push(token);
  }

  return {
    symbols,
    invalid,
    exceedsLimit: symbols.length > MAX_ADMIN_PICK_SYMBOLS
  };
}
