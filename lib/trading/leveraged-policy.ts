import { clamp } from "@/lib/utils";
import { bidAskSpreadPct, expectedMove } from "@/lib/trading/math";
import type { OptionContract, StrategyContext, UniverseSymbol } from "@/lib/trading/types";

export const LEVERAGED_PUT_MIN_DTE = 10;
export const LEVERAGED_PUT_MAX_DTE = 24;
export const LEVERAGED_CALL_MIN_DTE = 7;
export const LEVERAGED_CALL_MAX_DTE = 21;
export const LEVERAGED_CALL_DELTA_MIN = 0.2;
export const LEVERAGED_CALL_DELTA_MAX = 0.35;

const PUT_ELIGIBLE_SECTORS = new Set(["Leveraged Index", "Leveraged Sector"]);

export function leveragedPutDeltaRange(leverageMultiple: 2 | 3 | undefined) {
  return leverageMultiple === 3
    ? { min: 0.06, max: 0.12, target: 0.09 }
    : { min: 0.08, max: 0.15, target: 0.11 };
}

export function leveragedProductAllowsPuts(symbol: UniverseSymbol) {
  return (
    symbol.universeGroup === "leveraged" &&
    symbol.leverageDirection === "long" &&
    Boolean(symbol.referenceSymbol) &&
    PUT_ELIGIBLE_SECTORS.has(symbol.sector)
  );
}

export function isLeveragedContractLiquid(contract: OptionContract) {
  return (
    contract.bid > 0 &&
    contract.ask > contract.bid &&
    contract.volume >= 100 &&
    contract.openInterest >= 500 &&
    bidAskSpreadPct(contract) <= 10 &&
    Number.isFinite(contract.delta) &&
    contract.delta !== 0 &&
    Number.isFinite(contract.theta) &&
    Number.isFinite(contract.gamma) &&
    contract.impliedVolatility > 0
  );
}

export function leveragedTrendIsConfirmed(context: StrategyContext) {
  const reference = context.referenceTechnicals;
  if (!reference) return false;

  const leverageMultiple = context.symbol.leverageMultiple ?? 2;
  const etfTrendMinimum = leverageMultiple === 3 ? 68 : 64;
  const referenceTrendMinimum = leverageMultiple === 3 ? 64 : 60;
  const etf = context.technicals;

  return (
    etf.price > etf.sma20 &&
    etf.sma20 > etf.sma50 &&
    etf.trendScore >= etfTrendMinimum &&
    etf.momentumScore >= 52 &&
    etf.rsi14 >= 45 &&
    etf.rsi14 <= 68 &&
    etf.vwapPosition !== "below" &&
    reference.price > reference.sma20 &&
    reference.sma20 > reference.sma50 &&
    reference.trendScore >= referenceTrendMinimum &&
    reference.momentumScore >= 50 &&
    reference.rsi14 >= 45 &&
    reference.rsi14 <= 70 &&
    context.regime.score >= 54 &&
    context.regime.breadth >= 55 &&
    context.regime.vixDataAvailable !== false &&
    context.regime.vixLevel <= 22
  );
}

export function leveragedPutRiskMetrics(context: StrategyContext, contract: OptionContract) {
  const dte = Math.max(
    1,
    Math.round(
      (new Date(`${contract.expirationDate}T00:00:00Z`).getTime() - Date.now()) / 86_400_000
    )
  );
  const leverageMultiple = context.symbol.leverageMultiple ?? 2;
  const moveMultiplier = leverageMultiple === 3 ? 1.5 : 1.25;
  const stressDrop = leverageMultiple === 3 ? 0.1 : 0.06;
  const impliedMove = expectedMove(
    context.quote.price,
    contract.impliedVolatility,
    dte
  );
  const minimumDistance = Math.max(
    impliedMove * moveMultiplier,
    context.technicals.atr14 * 2.5
  );
  const strikeDistance = context.quote.price - contract.strike;
  const stressedPrice = context.quote.price * (1 - stressDrop);
  const stressCushion = stressedPrice - contract.strike;

  return {
    dte,
    impliedMove,
    minimumDistance,
    strikeDistance,
    stressedPrice,
    stressCushion,
    qualifies:
      strikeDistance >= minimumDistance &&
      contract.strike < stressedPrice
  };
}

export function leveragedAssignmentAvoidanceScore(
  context: StrategyContext,
  contract: OptionContract
) {
  const metrics = leveragedPutRiskMetrics(context, contract);
  const deltaRange = leveragedPutDeltaRange(context.symbol.leverageMultiple);
  const deltaScore = clamp(
    100 - Math.abs(Math.abs(contract.delta) - deltaRange.target) * 900,
    0,
    100
  );
  const distanceScore = clamp(
    (metrics.strikeDistance / Math.max(metrics.minimumDistance, 0.01)) * 75,
    0,
    100
  );
  const stressScore = clamp(
    (metrics.stressCushion / Math.max(context.technicals.atr14, 0.01)) * 35 + 50,
    0,
    100
  );

  return Math.round(deltaScore * 0.4 + distanceScore * 0.35 + stressScore * 0.25);
}
