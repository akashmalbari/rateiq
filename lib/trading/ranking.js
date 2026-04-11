function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function convictionSpread(signal = {}) {
  const bull = toNumber(signal?.scoreBreakdown?.bull);
  const bear = toNumber(signal?.scoreBreakdown?.bear);
  return Math.abs(bull - bear);
}

export function rankTradingSignal(signal = {}) {
  const action = String(signal.action || 'HOLD').trim().toUpperCase();
  if (action === 'HOLD') return 0;

  const confidence = toNumber(signal.confidence ?? signal.rawConfidence);
  const atrPct = toNumber(signal?.indicators?.atrPct);
  const volRatio = toNumber(signal?.indicators?.volRatio, 1);
  const adx = toNumber(signal?.indicators?.adx, 20);
  const winRate = signal.winRate == null ? null : toNumber(signal.winRate, null);
  const sampleSize = toNumber(signal.sampleSize);
  const avgReturn = signal.avgReturn == null ? null : toNumber(signal.avgReturn, null);
  const trendStrength = String(signal?.indicators?.trendStrength || '').toUpperCase();
  const dataMode = String(signal?.indicators?.dataMode || '').toUpperCase();

  let score = confidence;
  score += Math.min(18, convictionSpread(signal) * 0.25);
  score += Math.min(10, Math.max(0, volRatio - 1) * 8);
  score += clamp(9 - Math.abs(atrPct - 2.5) * 3, 0, 9);
  score += Math.min(8, Math.max(0, adx - 20) * 0.35);

  if (trendStrength === 'STRONG') score += 5;
  else if (trendStrength === 'MODERATE') score += 2.5;

  if (dataMode === 'CANDLES+QUOTE') score += 4;
  else if (dataMode === 'QUOTE ONLY') score -= 8;

  if (winRate != null && sampleSize > 0) {
    score += clamp((winRate - 50) * 0.25, -6, 10);
    score += Math.min(4, sampleSize / 10);
  }

  if (avgReturn != null && sampleSize > 0) {
    score += clamp(avgReturn * 0.3, -4, 6);
  }

  return +Math.max(0, score).toFixed(1);
}

export function compareRankedSignals(a = {}, b = {}) {
  const rankDelta = rankTradingSignal(b) - rankTradingSignal(a);
  if (rankDelta !== 0) return rankDelta;

  const confidenceDelta = toNumber(b.confidence ?? b.rawConfidence) - toNumber(a.confidence ?? a.rawConfidence);
  if (confidenceDelta !== 0) return confidenceDelta;

  const convictionDelta = convictionSpread(b) - convictionSpread(a);
  if (convictionDelta !== 0) return convictionDelta;

  return String(a.symbol || '').localeCompare(String(b.symbol || ''));
}
