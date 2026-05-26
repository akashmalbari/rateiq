import { clamp } from "@/lib/utils";
import type { Candle, OptionContract, OptionLeg, StrategyType, TechnicalSnapshot } from "@/lib/trading/types";

export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

export function sma(values: number[], period: number) {
  if (values.length < period) return mean(values);
  return mean(values.slice(-period));
}

export function ema(values: number[], period: number) {
  if (!values.length) return 0;
  const multiplier = 2 / (period + 1);
  return values.reduce((prev, value, index) => {
    if (index === 0) return value;
    return value * multiplier + prev * (1 - multiplier);
  }, values[0]);
}

export function rsi(values: number[], period = 14) {
  if (values.length <= period) return 50;

  const changes = values.slice(1).map((value, index) => value - values[index]);
  const recent = changes.slice(-period);
  const gains = recent.filter((change) => change > 0);
  const losses = recent.filter((change) => change < 0).map(Math.abs);
  const avgGain = mean(gains);
  const avgLoss = mean(losses);

  if (avgLoss === 0) return 72;
  const rs = avgGain / avgLoss;
  return clamp(100 - 100 / (1 + rs), 0, 100);
}

export function macdHistogram(values: number[]) {
  const macdLine = ema(values, 12) - ema(values, 26);
  const signal = ema([...values.slice(-33), macdLine], 9);
  return macdLine - signal;
}

export function atr(candles: Candle[], period = 14) {
  if (candles.length < 2) return 0;
  const trueRanges = candles.slice(1).map((candle, index) => {
    const prevClose = candles[index].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - prevClose),
      Math.abs(candle.low - prevClose)
    );
  });
  return sma(trueRanges, period);
}

export function calculateTechnicals(symbol: string, candles: Candle[], vwap?: number): TechnicalSnapshot {
  const closes = candles.map((candle) => candle.close);
  const price = closes.at(-1) ?? 0;
  const rsi14 = rsi(closes);
  const histogram = macdHistogram(closes);
  const atr14 = atr(candles);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const atrPercent = price ? (atr14 / price) * 100 : 0;
  const trendScore = clamp(
    50 +
      (price > sma20 ? 10 : -10) +
      (sma20 > sma50 ? 12 : -12) +
      (sma50 > sma200 ? 15 : -15) +
      clamp(histogram / Math.max(price * 0.002, 0.01), -10, 10),
    0,
    100
  );
  const momentumScore = clamp(
    50 + (rsi14 - 50) * 0.8 + clamp(histogram / Math.max(price * 0.001, 0.01), -15, 15),
    0,
    100
  );

  let vwapPosition: TechnicalSnapshot["vwapPosition"] = "near";
  if (vwap && price > vwap * 1.003) vwapPosition = "above";
  if (vwap && price < vwap * 0.997) vwapPosition = "below";

  return {
    symbol,
    price,
    rsi14,
    macdHistogram: histogram,
    atr14,
    atrPercent,
    sma20,
    sma50,
    sma200,
    trendScore,
    momentumScore,
    vwapPosition
  };
}

export function midPrice(contract: Pick<OptionContract, "bid" | "ask">) {
  return Number(((contract.bid + contract.ask) / 2).toFixed(2));
}

export function bidAskSpreadPct(contract: Pick<OptionContract, "bid" | "ask">) {
  const mid = midPrice(contract);
  if (!mid) return 100;
  return ((contract.ask - contract.bid) / mid) * 100;
}

export function liquidityScore(contract: OptionContract) {
  const spread = bidAskSpreadPct(contract);
  const volumeScore = clamp((contract.volume / 1500) * 40, 0, 40);
  const oiScore = clamp((contract.openInterest / 4000) * 35, 0, 35);
  const spreadScore = clamp(25 - spread * 1.7, 0, 25);
  return Math.round(volumeScore + oiScore + spreadScore);
}

export function isLiquid(contract: OptionContract) {
  return (
    contract.bid > 0 &&
    contract.ask > contract.bid &&
    contract.volume >= 75 &&
    contract.openInterest >= 250 &&
    bidAskSpreadPct(contract) <= 18
  );
}

export function expectedMove(price: number, impliedVolatility: number, daysToExpiration: number) {
  return price * impliedVolatility * Math.sqrt(daysToExpiration / 365);
}

export function daysBetween(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

export function probabilityTouchlessCredit(
  price: number,
  shortStrike: number,
  impliedVolatility: number,
  daysToExpiration: number,
  type: "put" | "call"
) {
  const move = expectedMove(price, impliedVolatility, daysToExpiration);
  const distance = type === "put" ? price - shortStrike : shortStrike - price;
  return clamp(50 + (distance / Math.max(move, 1)) * 18, 52, 87);
}

export function aggregateGreeks(legs: OptionLeg[]) {
  return legs.reduce(
    (acc, leg) => {
      const sign = leg.action === "buy" ? 1 : -1;
      acc.delta += leg.delta * sign;
      acc.gamma += leg.gamma * sign;
      acc.theta += leg.theta * sign;
      acc.vega += leg.impliedVolatility * 0.01 * sign;
      return acc;
    },
    { delta: 0, gamma: 0, theta: 0, vega: 0 }
  );
}

export function estimateHistoricalWinRate(strategyType: StrategyType, technicalScore: number, regimeScore: number) {
  const base: Record<StrategyType, number> = {
    buy_call: 53,
    sell_call: 64,
    buy_put: 52,
    sell_put: 68,
    cash_secured_put: 68,
    covered_call: 64,
    bull_put_credit_spread: 67,
    bear_call_credit_spread: 65,
    bull_call_debit_spread: 54,
    bear_put_debit_spread: 53,
    iron_condor: 62,
    directional_call: 51,
    directional_put: 50
  };

  return clamp(base[strategyType] + (technicalScore - 50) * 0.12 + (regimeScore - 50) * 0.08, 40, 78);
}

export function positionSizePct(
  probabilityOfProfit: number,
  maxRisk: number,
  maxReward: number,
  confidenceScore: number
) {
  const p = probabilityOfProfit / 100;
  const b = Math.max(maxReward / Math.max(maxRisk, 1), 0.05);
  const kelly = (p * (b + 1) - 1) / b;
  const riskCap = maxRisk > 2000 ? 1.25 : maxRisk > 900 ? 1.75 : 2.5;
  return Number(clamp(kelly * 12 * (confidenceScore / 100), 0.35, riskCap).toFixed(2));
}
