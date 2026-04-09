import { fetchCandles, fetchProfile, fetchQuote } from './finnhub';

function calcRSI(closes, n = 14) {
  if (closes.length < n + 1) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = closes.length - n; i < closes.length; i += 1) {
    const delta = closes[i] - closes[i - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }

  const rs = gains / (losses || 1e-9);
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

function calcEMA(arr, n) {
  const k = 2 / (n + 1);
  let ema = arr[0];
  for (let i = 1; i < arr.length; i += 1) {
    ema = arr[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcMACD(closes) {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 };

  const ema12 = calcEMA(closes.slice(-12), 12);
  const ema26 = calcEMA(closes.slice(-26), 26);
  const macdLine = ema12 - ema26;

  const series = [];
  for (let i = 26; i <= closes.length; i += 1) {
    const e12 = calcEMA(closes.slice(i - 12, i), 12);
    const e26 = calcEMA(closes.slice(i - 26, i), 26);
    series.push(e12 - e26);
  }

  const signalLine = series.length >= 9 ? calcEMA(series.slice(-9), 9) : macdLine;
  return {
    macd: +macdLine.toFixed(4),
    signal: +signalLine.toFixed(4),
    hist: +(macdLine - signalLine).toFixed(4),
  };
}

function calcBB(closes, n = 20) {
  if (closes.length < n) return 0.5;
  const sample = closes.slice(-n);
  const mean = sample.reduce((sum, value) => sum + value, 0) / n;
  const std = Math.sqrt(sample.map((value) => (value - mean) ** 2).reduce((sum, value) => sum + value, 0) / n);

  if (std === 0) return 0.5;

  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  return +((closes[closes.length - 1] - lower) / (upper - lower)).toFixed(3);
}

function calcATR(highs, lows, closes, n = 14) {
  const ranges = [];
  for (let i = Math.max(1, closes.length - n); i < closes.length; i += 1) {
    ranges.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  return ranges.length ? ranges.reduce((sum, value) => sum + value, 0) / ranges.length : closes[closes.length - 1] * 0.015;
}

function calcVolRatio(volumes) {
  if (volumes.length < 20) return 1;
  const avg = volumes.slice(-20).reduce((sum, value) => sum + value, 0) / 20;
  return avg === 0 ? 1 : +(volumes[volumes.length - 1] / avg).toFixed(2);
}

function calcStoch(highs, lows, closes, n = 14) {
  if (closes.length < n) return 50;
  const highestHigh = Math.max(...highs.slice(-n));
  const lowestLow = Math.min(...lows.slice(-n));
  if (highestHigh === lowestLow) return 50;
  return +(((closes[closes.length - 1] - lowestLow) / (highestHigh - lowestLow)) * 100).toFixed(1);
}

function calcSMA(values, n) {
  const sample = values.slice(-n);
  return sample.reduce((sum, value) => sum + value, 0) / sample.length;
}

function score(inds, strategy = 'momentum', regime = 'neutral') {
  let bull = 0;
  let bear = 0;
  const reasons = [];

  if (strategy === 'momentum') {
    if (inds.rsi > 50 && inds.rsi < 70) {
      bull += 25;
      reasons.push(`RSI ${inds.rsi} in bullish momentum zone`);
    } else if (inds.rsi < 45 && inds.rsi > 30) {
      bear += 20;
      reasons.push(`RSI ${inds.rsi} showing bearish momentum`);
    } else if (inds.rsi >= 70) {
      bull += 8;
      reasons.push(`RSI ${inds.rsi} overbought — upside momentum with tighter risk`);
    } else if (inds.rsi <= 30) {
      bear += 8;
      reasons.push(`RSI ${inds.rsi} oversold — trend pressure remains elevated`);
    }

    if (inds.macdHist > 0.01) {
      bull += 25;
      reasons.push(`MACD histogram +${inds.macdHist.toFixed(3)} confirms bullish momentum`);
    } else if (inds.macdHist < -0.01) {
      bear += 25;
      reasons.push(`MACD histogram ${inds.macdHist.toFixed(3)} confirms bearish momentum`);
    }

    if (inds.goldenCross) {
      bull += 20;
      reasons.push(`Price above 50-SMA (${inds.sma50}) and 200-SMA (${inds.sma200})`);
    } else if (inds.deathCross) {
      bear += 20;
      reasons.push(`Price below 50-SMA (${inds.sma50}) and 200-SMA (${inds.sma200})`);
    } else if (inds.above50) {
      bull += 10;
      reasons.push(`Price holding above 50-SMA (${inds.sma50})`);
    } else {
      bear += 10;
      reasons.push(`Price trading below 50-SMA (${inds.sma50})`);
    }

    if (inds.volRatio > 1.5) {
      bull += 12;
      reasons.push(`Volume ${inds.volRatio}x 20-day average confirms the move`);
    }
  } else if (strategy === 'mean_reversion') {
    if (inds.rsi <= 30) {
      bull += 40;
      reasons.push(`RSI ${inds.rsi} signals extreme oversold conditions`);
    } else if (inds.rsi >= 70) {
      bear += 40;
      reasons.push(`RSI ${inds.rsi} signals extreme overbought conditions`);
    }

    if (inds.bbPct <= 0.1) {
      bull += 35;
      reasons.push(`BB%B ${inds.bbPct} shows price near the lower Bollinger band`);
    } else if (inds.bbPct >= 0.9) {
      bear += 35;
      reasons.push(`BB%B ${inds.bbPct} shows price near the upper Bollinger band`);
    }

    if (inds.stochK < 20) {
      bull += 20;
      reasons.push(`Stochastic K ${inds.stochK} supports a reversal bounce setup`);
    } else if (inds.stochK > 80) {
      bear += 20;
      reasons.push(`Stochastic K ${inds.stochK} supports a downside reversal setup`);
    }
  } else if (strategy === 'breakout') {
    if (inds.volRatio > 2 && inds.rsi > 55) {
      bull += 45;
      reasons.push(`Volume surge (${inds.volRatio}x) plus RSI ${inds.rsi} supports breakout continuation`);
    } else if (inds.volRatio > 2 && inds.rsi < 45) {
      bear += 45;
      reasons.push(`High-volume breakdown (${inds.volRatio}x) with RSI ${inds.rsi}`);
    }

    if (inds.atrPct > 2) {
      bull += 8;
      bear += 8;
      reasons.push(`ATR ${inds.atrPct}% shows volatility expansion`);
    }

    if (inds.above50 && inds.macdHist > 0) {
      bull += 25;
      reasons.push('Price is above trend support with positive MACD confirmation');
    }

    if (!inds.above50 && inds.macdHist < 0) {
      bear += 25;
      reasons.push('Price is below trend support with negative MACD confirmation');
    }
  } else if (strategy === 'volatility') {
    if (inds.ivRank > 50) {
      bull += 20;
      bear += 20;
      reasons.push(`Historical volatility proxy ${inds.ivPct}% favors premium-selling structures`);
    } else {
      if (inds.macdHist > 0) {
        bull += 30;
        reasons.push(`Lower volatility with positive MACD favors directional upside exposure`);
      } else {
        bear += 30;
        reasons.push(`Lower volatility with negative MACD favors directional downside exposure`);
      }
    }

    if (inds.volRatio > 1.8) {
      reasons.push(`Volume spike ${inds.volRatio}x suggests volatility expansion risk`);
    }
  }

  if (regime === 'bull') bull *= 1.15;
  if (regime === 'bear') bear *= 1.15;

  const net = bull - bear;

  if (Math.abs(net) < 30) {
    return {
      action: 'HOLD',
      rawConfidence: Math.min(65, 40 + Math.abs(net)),
      reasons: reasons.length ? reasons : ['Signal strength did not exceed the trade threshold.'],
      bullScore: +bull.toFixed(1),
      bearScore: +bear.toFixed(1),
    };
  }

  if (net > 0) {
    return {
      action: 'BUY',
      rawConfidence: Math.min(95, 50 + bull * 0.55),
      reasons,
      bullScore: +bull.toFixed(1),
      bearScore: +bear.toFixed(1),
    };
  }

  return {
    action: 'SELL',
    rawConfidence: Math.min(95, 50 + bear * 0.55),
    reasons,
    bullScore: +bull.toFixed(1),
    bearScore: +bear.toFixed(1),
  };
}

export async function generateSignal(symbol, strategy = 'momentum') {
  const sym = symbol.trim().toUpperCase();
  const to = Math.floor(Date.now() / 1000);
  const from = to - 120 * 86400;

  const [quote, candles, profile] = await Promise.all([
    fetchQuote(sym),
    fetchCandles(sym, 'D', from, to),
    fetchProfile(sym),
  ]);

  if (!quote?.c) throw new Error('Symbol not found');
  if (!candles || candles.s !== 'ok' || !candles.c || candles.c.length < 20) {
    throw new Error('Not enough candle data');
  }

  const closes = [...candles.c];
  closes[closes.length - 1] = quote.c;

  const entryPrice = quote.c;
  const atr = calcATR(candles.h, candles.l, closes);
  const sma50 = +(closes.length >= 50 ? calcSMA(closes, 50) : calcSMA(closes, Math.min(20, closes.length))).toFixed(2);
  const sma200 = +(closes.length >= 200 ? calcSMA(closes, 200) : sma50).toFixed(2);
  const returns = closes
    .slice(-20)
    .map((value, index, arr) => (index > 0 ? Math.log(value / arr[index - 1]) : 0))
    .slice(1);
  const hv = returns.length
    ? +(Math.sqrt(returns.reduce((sum, value) => sum + value * value, 0) / returns.length) * Math.sqrt(252) * 100).toFixed(1)
    : 20;

  const indicators = {
    rsi: calcRSI(closes),
    macdHist: calcMACD(closes).hist,
    bbPct: calcBB(closes),
    stochK: calcStoch(candles.h, candles.l, closes),
    atr,
    volRatio: calcVolRatio(candles.v),
    atrPct: +((atr / entryPrice) * 100).toFixed(2),
    sma50,
    sma200,
    above50: entryPrice > sma50,
    above200: entryPrice > sma200,
    goldenCross: entryPrice > sma50 && entryPrice > sma200,
    deathCross: entryPrice < sma50 && entryPrice < sma200,
    ivPct: hv,
    ivRank: Math.min(100, Math.max(0, hv - 10)),
    adx: +(20 + Math.abs(calcRSI(closes) - 50) * 0.5).toFixed(0),
    trendStrength: Math.abs(calcRSI(closes) - 50) > 20 ? 'STRONG' : Math.abs(calcRSI(closes) - 50) > 10 ? 'MODERATE' : 'WEAK',
  };

  const scored = score(indicators, strategy);
  const stopLoss = scored.action === 'SELL' ? entryPrice + indicators.atr * 1.5 : entryPrice - indicators.atr * 1.5;
  const targetPrice = scored.action === 'SELL' ? entryPrice - indicators.atr * 2 : entryPrice + indicators.atr * 2;

  return {
    symbol: sym,
    strategy,
    action: scored.action,
    rawConfidence: Math.round(scored.rawConfidence),
    entryPrice,
    stopLoss,
    targetPrice,
    indicators,
    reasons: scored.reasons,
    profileName: profile?.name || sym,
    scoreBreakdown: {
      bull: scored.bullScore,
      bear: scored.bearScore,
    },
  };
}
