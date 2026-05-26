import { clamp } from "@/lib/utils";
import {
  aggregateGreeks,
  daysBetween,
  estimateHistoricalWinRate,
  expectedMove,
  isLiquid,
  liquidityScore,
  midPrice,
  positionSizePct,
  probabilityTouchlessCredit
} from "@/lib/trading/math";
import type {
  ContractType,
  OptionContract,
  OptionLeg,
  Recommendation,
  StrategyContext,
  StrategyModule,
  StrategyType
} from "@/lib/trading/types";

function expirationDays(contract: OptionContract) {
  return daysBetween(new Date().toISOString().slice(0, 10), contract.expirationDate);
}

function toLeg(contract: OptionContract, action: OptionLeg["action"]): OptionLeg {
  return {
    action,
    type: contract.type,
    strike: contract.strike,
    expirationDate: contract.expirationDate,
    bid: contract.bid,
    ask: contract.ask,
    mid: midPrice(contract),
    delta: contract.delta,
    gamma: contract.gamma,
    theta: contract.theta,
    impliedVolatility: contract.impliedVolatility
  };
}

function sameExpiration(chain: OptionContract[], expirationDate: string, type: ContractType) {
  return chain
    .filter((contract) => contract.expirationDate === expirationDate && contract.type === type && isLiquid(contract))
    .sort((a, b) => a.strike - b.strike);
}

function findByDelta(
  contracts: OptionContract[],
  type: ContractType,
  targetDelta: number,
  predicate: (contract: OptionContract) => boolean = () => true
) {
  return contracts
    .filter((contract) => contract.type === type && predicate(contract) && isLiquid(contract))
    .sort((a, b) => Math.abs(Math.abs(a.delta) - targetDelta) - Math.abs(Math.abs(b.delta) - targetDelta))[0];
}

function averageLiquidity(contracts: OptionContract[]) {
  return Math.round(
    contracts.reduce((sum, contract) => sum + liquidityScore(contract), 0) / contracts.length
  );
}

function earningsWarning(context: StrategyContext) {
  if (!context.earnings.date) return null;
  const days = daysBetween(new Date().toISOString().slice(0, 10), context.earnings.date);
  if (days <= 10) return `Earnings are ${days} calendar days away; avoid opening unless event risk is intentional.`;
  if (days <= 21) return `Earnings are inside the next three weeks; size conservatively.`;
  return null;
}

function scoreCandidate(args: {
  type: StrategyType;
  probabilityOfProfit: number;
  riskRewardRatio: number;
  liquidityScore: number;
  technicalAlignment: number;
  ivPercentile: number;
  historicalWinRate: number;
  regimeScore: number;
  earningsPenalty?: number;
}) {
  const rrScore = clamp(args.riskRewardRatio * 35, 0, 100);
  return Math.round(
    clamp(
      args.probabilityOfProfit * 0.32 +
        rrScore * 0.14 +
        args.liquidityScore * 0.18 +
        args.technicalAlignment * 0.14 +
        args.ivPercentile * 0.08 +
        args.historicalWinRate * 0.1 +
        args.regimeScore * 0.04 -
        (args.earningsPenalty ?? 0),
      0,
      99
    )
  );
}

function createRecommendation(args: {
  context: StrategyContext;
  type: StrategyType;
  name: string;
  legs: OptionLeg[];
  strikePrice: number;
  expirationDate: string;
  probabilityOfProfit: number;
  maxRisk: number;
  maxReward: number;
  technicalAlignment: number;
  rationale: string[];
  warnings?: string[];
  entry: string;
  exit: string;
  stop: string;
  profitTarget: string;
  timeStop: string;
}) {
  const liquidity = averageLiquidity(
    args.legs.map((leg) => ({
      symbol: "",
      underlyingSymbol: args.context.symbol.symbol,
      expirationDate: leg.expirationDate,
      strike: leg.strike,
      type: leg.type,
      bid: leg.bid,
      ask: leg.ask,
      volume: 1000,
      openInterest: 1500,
      impliedVolatility: leg.impliedVolatility,
      delta: leg.delta,
      gamma: leg.gamma,
      theta: leg.theta,
      vega: 0
    }))
  );
  const riskRewardRatio = Number((args.maxReward / Math.max(args.maxRisk, 1)).toFixed(2));
  const earnings = earningsWarning(args.context);
  const warnings = [...(args.warnings ?? []), ...(earnings ? [earnings] : [])];
  const greeks = aggregateGreeks(args.legs);
  const historicalWinRate = estimateHistoricalWinRate(
    args.type,
    args.technicalAlignment,
    args.context.regime.score
  );
  const confidenceScore = scoreCandidate({
    type: args.type,
    probabilityOfProfit: args.probabilityOfProfit,
    riskRewardRatio,
    liquidityScore: liquidity,
    technicalAlignment: args.technicalAlignment,
    ivPercentile: args.context.ivPercentile,
    historicalWinRate,
    regimeScore: args.context.regime.score,
    earningsPenalty: earnings ? 8 : 0
  });
  const days = daysBetween(new Date().toISOString().slice(0, 10), args.expirationDate);
  const iv = args.legs.reduce((sum, leg) => sum + leg.impliedVolatility, 0) / args.legs.length;

  return {
    rank: 0,
    symbol: args.context.symbol.symbol,
    companyName: args.context.symbol.companyName,
    sector: args.context.symbol.sector,
    strategyType: args.type,
    strategyName: args.name,
    entryRecommendation: args.entry,
    exitRecommendation: args.exit,
    strikePrice: args.strikePrice,
    expirationDate: args.expirationDate,
    probabilityOfProfit: Number(args.probabilityOfProfit.toFixed(1)),
    expectedMove: Number(expectedMove(args.context.quote.price, iv, days).toFixed(2)),
    maxRisk: Number(args.maxRisk.toFixed(2)),
    maxReward: Number(args.maxReward.toFixed(2)),
    riskRewardRatio,
    confidenceScore,
    greeks: {
      delta: Number(greeks.delta.toFixed(3)),
      gamma: Number(greeks.gamma.toFixed(4)),
      theta: Number(greeks.theta.toFixed(3)),
      vega: Number(greeks.vega.toFixed(3))
    },
    ivPercentile: Math.round(args.context.ivPercentile),
    liquidityScore: liquidity,
    technicalScore: Math.round(args.technicalAlignment),
    historicalWinRate: Number(historicalWinRate.toFixed(1)),
    suggestedPositionSizePct: positionSizePct(
      args.probabilityOfProfit,
      args.maxRisk,
      args.maxReward,
      confidenceScore
    ),
    optionLegs: args.legs,
    tradePlan: {
      entry: args.entry,
      exit: args.exit,
      stopLoss: args.stop,
      profitTarget: args.profitTarget,
      timeStop: args.timeStop
    },
    rationale: args.rationale,
    warnings,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(`${args.expirationDate}T21:00:00Z`).toISOString()
  } satisfies Recommendation;
}

function bullishAlignment(context: StrategyContext) {
  return clamp(
    context.technicals.trendScore * 0.5 +
      context.technicals.momentumScore * 0.3 +
      (context.regime.score >= 55 ? 12 : context.regime.score <= 42 ? -10 : 4) +
      (context.technicals.vwapPosition === "above" ? 8 : context.technicals.vwapPosition === "below" ? -8 : 0),
    0,
    100
  );
}

function bearishAlignment(context: StrategyContext) {
  return clamp(
    (100 - context.technicals.trendScore) * 0.5 +
      (100 - context.technicals.momentumScore) * 0.3 +
      (context.regime.score <= 45 ? 14 : context.regime.score >= 62 ? -12 : 3) +
      (context.technicals.vwapPosition === "below" ? 8 : context.technicals.vwapPosition === "above" ? -8 : 0),
    0,
    100
  );
}

const cashSecuredPut: StrategyModule = {
  type: "cash_secured_put",
  name: "Cash Secured Put",
  enabledByDefault: true,
  evaluate(context) {
    if (context.ivPercentile < 35 || bullishAlignment(context) < 54) return null;
    const shortPut = findByDelta(
      context.chain.contracts,
      "put",
      0.22,
      (contract) => contract.strike < context.quote.price
    );
    if (!shortPut) return null;
    const credit = midPrice(shortPut) * 100;
    const collateral = shortPut.strike * 100;
    const risk = collateral - credit;
    const pop = probabilityTouchlessCredit(
      context.quote.price,
      shortPut.strike,
      shortPut.impliedVolatility,
      expirationDays(shortPut),
      "put"
    );

    return createRecommendation({
      context,
      type: "cash_secured_put",
      name: "Cash Secured Put",
      legs: [toLeg(shortPut, "sell")],
      strikePrice: shortPut.strike,
      expirationDate: shortPut.expirationDate,
      probabilityOfProfit: pop,
      maxRisk: risk,
      maxReward: credit,
      technicalAlignment: bullishAlignment(context),
      entry: `Sell the ${shortPut.expirationDate} ${shortPut.strike} put near $${midPrice(shortPut).toFixed(2)} credit.`,
      exit: "Close at 50-70% of max profit or roll only if assignment is acceptable.",
      stop: "Exit if short put doubles in value or price closes below the strike with weak breadth.",
      profitTarget: "Buy back at 30-50% of original credit.",
      timeStop: "Do not hold through earnings; close by 7 DTE if profit target has not triggered.",
      rationale: [
        "Elevated IV supports premium selling.",
        "Strike is below spot with positive trend alignment.",
        "Liquidity filters require volume, open interest, and controlled spread."
      ],
      warnings: ["Assignment risk requires full cash collateral."]
    });
  }
};

const coveredCall: StrategyModule = {
  type: "covered_call",
  name: "Covered Call",
  enabledByDefault: true,
  evaluate(context) {
    if (context.ivPercentile < 30 || context.technicals.rsi14 < 55) return null;
    const shortCall = findByDelta(
      context.chain.contracts,
      "call",
      0.25,
      (contract) => contract.strike > context.quote.price
    );
    if (!shortCall) return null;
    const credit = midPrice(shortCall) * 100;
    const calledAwayGain = Math.max(shortCall.strike - context.quote.price, 0) * 100;
    const maxReward = credit + calledAwayGain;

    return createRecommendation({
      context,
      type: "covered_call",
      name: "Covered Call",
      legs: [toLeg(shortCall, "sell")],
      strikePrice: shortCall.strike,
      expirationDate: shortCall.expirationDate,
      probabilityOfProfit: clamp(62 + (shortCall.strike - context.quote.price) / context.quote.price * 90, 55, 82),
      maxRisk: context.quote.price * 100 - credit,
      maxReward,
      technicalAlignment: clamp(100 - Math.abs(context.technicals.rsi14 - 62), 0, 100),
      entry: `Against 100 shares, sell the ${shortCall.expirationDate} ${shortCall.strike} call near $${midPrice(shortCall).toFixed(2)} credit.`,
      exit: "Close at 70-85% of max profit or allow assignment only if the sale price is acceptable.",
      stop: "Close or roll if upside breakout invalidates the income thesis.",
      profitTarget: "Buy back below 25-30% of original credit.",
      timeStop: "Close before earnings or inside the final week if gamma risk rises.",
      rationale: [
        "Premium income is favored when IV is above baseline.",
        "Call strike leaves measured upside room before assignment.",
        "Position is appropriate only for shares already owned or intended to be sold."
      ],
      warnings: ["Covered calls cap upside and retain downside stock risk."]
    });
  }
};

function verticalSpread(
  context: StrategyContext,
  type: "bull_put_credit_spread" | "bear_call_credit_spread" | "bull_call_debit_spread" | "bear_put_debit_spread"
) {
  const bullish = type.includes("bull");
  const credit = type.includes("credit");
  const optionType: ContractType = type.includes("put") ? "put" : "call";
  const alignment = bullish ? bullishAlignment(context) : bearishAlignment(context);
  if (alignment < (credit ? 52 : 58)) return null;
  if (credit && context.ivPercentile < 38) return null;
  if (!credit && context.ivPercentile > 72) return null;

  const shortOrLong = findByDelta(
    context.chain.contracts,
    optionType,
    credit ? 0.22 : 0.48,
    (contract) =>
      bullish
        ? optionType === "put"
          ? contract.strike < context.quote.price
          : contract.strike >= context.quote.price
        : optionType === "call"
          ? contract.strike > context.quote.price
          : contract.strike <= context.quote.price
  );
  if (!shortOrLong) return null;

  const candidates = sameExpiration(context.chain.contracts, shortOrLong.expirationDate, optionType);
  const width = context.quote.price > 300 ? 10 : context.quote.price > 100 ? 5 : 2.5;
  const hedge = candidates.find((contract) => {
    if (credit && optionType === "put") return contract.strike <= shortOrLong.strike - width;
    if (credit && optionType === "call") return contract.strike >= shortOrLong.strike + width;
    if (!credit && optionType === "call") return contract.strike >= shortOrLong.strike + width;
    return contract.strike <= shortOrLong.strike - width;
  });
  if (!hedge) return null;

  const first = midPrice(shortOrLong);
  const second = midPrice(hedge);
  const spreadWidth = Math.abs(shortOrLong.strike - hedge.strike) * 100;
  const net = Math.abs(first - second) * 100;
  if (credit && (net <= spreadWidth * 0.08 || net >= spreadWidth * 0.55)) return null;
  if (!credit && (net <= spreadWidth * 0.08 || net >= spreadWidth * 0.78)) return null;
  const maxReward = credit ? net : Math.max(spreadWidth - net, 1);
  const maxRisk = credit ? Math.max(spreadWidth - net, 1) : net;
  const pop = credit
    ? probabilityTouchlessCredit(
        context.quote.price,
        shortOrLong.strike,
        shortOrLong.impliedVolatility,
        expirationDays(shortOrLong),
        optionType
      )
    : clamp(46 + alignment * 0.22 + (credit ? 0 : 4), 45, 68);
  const nameMap: Record<typeof type, string> = {
    bull_put_credit_spread: "Bull Put Credit Spread",
    bear_call_credit_spread: "Bear Call Credit Spread",
    bull_call_debit_spread: "Bull Call Debit Spread",
    bear_put_debit_spread: "Bear Put Debit Spread"
  };
  const entryAction = credit ? "Sell" : "Buy";
  const legs = credit
    ? [toLeg(shortOrLong, "sell"), toLeg(hedge, "buy")]
    : [toLeg(shortOrLong, "buy"), toLeg(hedge, "sell")];
  const priceText = `${credit ? "credit" : "debit"} near $${(net / 100).toFixed(2)}`;

  return createRecommendation({
    context,
    type,
    name: nameMap[type],
    legs,
    strikePrice: shortOrLong.strike,
    expirationDate: shortOrLong.expirationDate,
    probabilityOfProfit: pop,
    maxRisk,
    maxReward,
    technicalAlignment: alignment,
    entry: `${entryAction} the ${shortOrLong.expirationDate} ${shortOrLong.strike}/${hedge.strike} ${optionType} spread for a ${priceText}.`,
    exit: credit ? "Close at 50-65% of max profit." : "Scale out at 75-100% return on debit or into resistance/support.",
    stop: credit ? "Stop if spread value reaches 2x initial credit." : "Stop if debit loses 45-55% or trend closes back through the 20-day average.",
    profitTarget: credit ? "Buy back around 35-50% of opening credit." : "Take profit when spread reaches 75% of max value.",
    timeStop: "Close by 7 DTE to avoid late-cycle gamma risk.",
    rationale: [
      bullish ? "Trend and momentum favor upside or neutral-to-up price action." : "Trend and momentum favor downside or neutral-to-down price action.",
      credit ? "High IV makes defined-risk premium selling more attractive." : "Debit structure avoids selling cheap volatility.",
      "Defined risk keeps loss bounded before entry."
    ]
  });
}

const ironCondor: StrategyModule = {
  type: "iron_condor",
  name: "Iron Condor",
  enabledByDefault: true,
  evaluate(context) {
    if (context.ivPercentile < 45 || context.regime.label === "high_volatility") return null;
    if (Math.abs(context.technicals.rsi14 - 50) > 12 || context.technicals.atrPercent > 4.2) return null;

    const shortPut = findByDelta(context.chain.contracts, "put", 0.18, (contract) => contract.strike < context.quote.price);
    const shortCall = findByDelta(context.chain.contracts, "call", 0.18, (contract) => contract.strike > context.quote.price);
    if (!shortPut || !shortCall || shortPut.expirationDate !== shortCall.expirationDate) return null;
    const putWing = sameExpiration(context.chain.contracts, shortPut.expirationDate, "put").find(
      (contract) => contract.strike < shortPut.strike
    );
    const callWing = sameExpiration(context.chain.contracts, shortCall.expirationDate, "call").find(
      (contract) => contract.strike > shortCall.strike
    );
    if (!putWing || !callWing) return null;

    const credit = (midPrice(shortPut) - midPrice(putWing) + midPrice(shortCall) - midPrice(callWing)) * 100;
    const width = Math.max(shortPut.strike - putWing.strike, callWing.strike - shortCall.strike) * 100;
    if (credit <= 20 || width <= credit) return null;
    const pop = clamp(
      (probabilityTouchlessCredit(context.quote.price, shortPut.strike, shortPut.impliedVolatility, expirationDays(shortPut), "put") +
        probabilityTouchlessCredit(context.quote.price, shortCall.strike, shortCall.impliedVolatility, expirationDays(shortCall), "call")) /
        2 -
        3,
      55,
      82
    );

    return createRecommendation({
      context,
      type: "iron_condor",
      name: "Iron Condor",
      legs: [toLeg(shortPut, "sell"), toLeg(putWing, "buy"), toLeg(shortCall, "sell"), toLeg(callWing, "buy")],
      strikePrice: shortPut.strike,
      expirationDate: shortPut.expirationDate,
      probabilityOfProfit: pop,
      maxRisk: width - credit,
      maxReward: credit,
      technicalAlignment: clamp(100 - Math.abs(context.technicals.rsi14 - 50) * 3 - context.technicals.atrPercent * 5, 0, 100),
      entry: `Sell the ${shortPut.expirationDate} ${putWing.strike}/${shortPut.strike}/${shortCall.strike}/${callWing.strike} iron condor near $${(credit / 100).toFixed(2)} credit.`,
      exit: "Close at 40-55% of max profit or if either short strike delta exceeds 0.32.",
      stop: "Exit if loss reaches 1.5x original credit or market regime flips risk-off.",
      profitTarget: "Buy back around half of opening credit.",
      timeStop: "Close by 10 DTE or earlier if implied volatility collapses.",
      rationale: [
        "Range-bound technical profile with elevated premium.",
        "Both short strikes sit outside the expected move band.",
        "Defined wings cap tail risk."
      ]
    });
  }
};

const directionalCall: StrategyModule = {
  type: "directional_call",
  name: "Directional Call",
  enabledByDefault: true,
  evaluate(context) {
    const alignment = bullishAlignment(context);
    if (alignment < 72 || context.ivPercentile > 58) return null;
    const call = findByDelta(context.chain.contracts, "call", 0.55, (contract) => contract.strike >= context.quote.price * 0.98);
    if (!call) return null;
    const debit = midPrice(call) * 100;
    return createRecommendation({
      context,
      type: "directional_call",
      name: "Directional Call",
      legs: [toLeg(call, "buy")],
      strikePrice: call.strike,
      expirationDate: call.expirationDate,
      probabilityOfProfit: clamp(42 + alignment * 0.25, 45, 66),
      maxRisk: debit,
      maxReward: debit * 2.4,
      technicalAlignment: alignment,
      entry: `Buy the ${call.expirationDate} ${call.strike} call near $${midPrice(call).toFixed(2)} only on a hold above VWAP.`,
      exit: "Scale out into a 70-100% option gain or failed breakout.",
      stop: "Stop at 45% premium loss or a close back below the 20-day average.",
      profitTarget: "Target 1.8-2.4x premium before expiration week.",
      timeStop: "Exit with at least 14 DTE remaining if momentum stalls.",
      rationale: [
        "Strong trend and momentum alignment justify directional exposure.",
        "IV is not high enough to penalize long premium.",
        "VWAP confirmation reduces chase risk."
      ],
      warnings: ["Long options can expire worthless."]
    });
  }
};

const directionalPut: StrategyModule = {
  type: "directional_put",
  name: "Directional Put",
  enabledByDefault: true,
  evaluate(context) {
    const alignment = bearishAlignment(context);
    if (alignment < 72 || context.ivPercentile > 60) return null;
    const put = findByDelta(context.chain.contracts, "put", 0.55, (contract) => contract.strike <= context.quote.price * 1.02);
    if (!put) return null;
    const debit = midPrice(put) * 100;
    return createRecommendation({
      context,
      type: "directional_put",
      name: "Directional Put",
      legs: [toLeg(put, "buy")],
      strikePrice: put.strike,
      expirationDate: put.expirationDate,
      probabilityOfProfit: clamp(42 + alignment * 0.25, 45, 66),
      maxRisk: debit,
      maxReward: debit * 2.2,
      technicalAlignment: alignment,
      entry: `Buy the ${put.expirationDate} ${put.strike} put near $${midPrice(put).toFixed(2)} on rejection below VWAP.`,
      exit: "Scale out into a 70-100% option gain or when downside momentum fades.",
      stop: "Stop at 45% premium loss or a close back above the 20-day average.",
      profitTarget: "Target 1.7-2.2x premium before expiration week.",
      timeStop: "Exit with at least 14 DTE remaining if the breakdown stalls.",
      rationale: [
        "Trend and breadth favor downside exposure.",
        "Long premium keeps risk capped.",
        "Entry requires intraday confirmation."
      ],
      warnings: ["Long options can expire worthless."]
    });
  }
};

export const strategyRegistry: StrategyModule[] = [
  cashSecuredPut,
  coveredCall,
  {
    type: "bull_put_credit_spread",
    name: "Bull Put Credit Spread",
    enabledByDefault: true,
    evaluate: (context) => verticalSpread(context, "bull_put_credit_spread")
  },
  {
    type: "bear_call_credit_spread",
    name: "Bear Call Credit Spread",
    enabledByDefault: true,
    evaluate: (context) => verticalSpread(context, "bear_call_credit_spread")
  },
  {
    type: "bull_call_debit_spread",
    name: "Bull Call Debit Spread",
    enabledByDefault: true,
    evaluate: (context) => verticalSpread(context, "bull_call_debit_spread")
  },
  {
    type: "bear_put_debit_spread",
    name: "Bear Put Debit Spread",
    enabledByDefault: true,
    evaluate: (context) => verticalSpread(context, "bear_put_debit_spread")
  },
  ironCondor,
  directionalCall,
  directionalPut
];
