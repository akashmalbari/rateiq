import { clamp } from "@/lib/utils";
import { bidAskSpreadPct, daysBetween, expectedMove, isLiquid } from "@/lib/trading/math";
import type { ContractType, OptionContract, OptionsChain } from "@/lib/trading/types";

/** A single-leg short option position that can be closed and re-opened later. */
export interface ShortOptionRollInput {
  underlyingPrice: number;
  asOfDate: string;
  currentContract: OptionContract;
  /** Credit received when the current contract was opened, per share. */
  entryCredit: number;
  contracts?: number;
  /** Candidate contracts, normally from the current option chain. */
  chain: OptionsChain;
  /** Allows a deliberate debit roll when no credit roll is available. */
  allowDebitRoll?: boolean;
}

export interface RollCandidate {
  contract: OptionContract;
  daysToExpiration: number;
  rollCashFlow: number;
  rollCashFlowDollars: number;
  /** P/L from closing the original short option; the new sale is not realized P/L. */
  realizedClosePnl: number;
  /** Net option cash flow across the original opening, close, and new opening. */
  netCreditAfterRoll: number;
  adjustedBreakeven: number;
  expectedMove: number;
  expectedMoveBoundary: number;
  deltaReduction: number;
  liquidityScore: number;
  score: number;
  rationale: string[];
}

export interface RollAnalysis {
  type: ContractType;
  currentCloseDebit: number;
  currentUnrealizedPnl: number;
  candidates: RollCandidate[];
  recommendation: RollCandidate | null;
  warnings: string[];
}

const CONTRACT_MULTIPLIER = 100;

function perContract(value: number, contracts: number) {
  return Number((value * CONTRACT_MULTIPLIER * contracts).toFixed(2));
}

function isSaferStrike(type: ContractType, strike: number, currentStrike: number) {
  return type === "call" ? strike > currentStrike : strike < currentStrike;
}

function adjustedBreakeven(type: ContractType, strike: number, netCredits: number) {
  return Number((type === "call" ? strike + netCredits : strike - netCredits).toFixed(2));
}

/**
 * Ranks one-leg short-option rolls. Prices use executable sides: buy-to-close at
 * the current ask and sell-to-open at the candidate bid. A roll realizes the
 * current loss; it never makes that loss disappear, so the result exposes it.
 */
export function calculateShortOptionRolls(input: ShortOptionRollInput): RollAnalysis {
  const contracts = Math.max(1, input.contracts ?? 1);
  const current = input.currentContract;
  const currentCloseDebit = current.ask;
  const currentUnrealizedPnl = perContract(input.entryCredit - currentCloseDebit, contracts);
  const currentDte = daysBetween(input.asOfDate, current.expirationDate);
  const type = current.type;
  const warnings: string[] = [];

  if (!Number.isFinite(input.underlyingPrice) || input.underlyingPrice <= 0) {
    throw new Error("underlyingPrice must be a positive number.");
  }
  if (!Number.isFinite(input.entryCredit) || input.entryCredit < 0) {
    throw new Error("entryCredit must be a non-negative number.");
  }

  const candidates = input.chain.contracts
    .filter((candidate) => candidate.underlyingSymbol === current.underlyingSymbol)
    .filter((candidate) => candidate.type === type)
    .filter((candidate) => candidate.expirationDate > current.expirationDate)
    .filter((candidate) => daysBetween(input.asOfDate, candidate.expirationDate) >= Math.max(14, currentDte + 7))
    .filter((candidate) => isLiquid(candidate))
    .filter((candidate) => isSaferStrike(type, candidate.strike, current.strike))
    .map((candidate): RollCandidate => {
      const daysToExpiration = daysBetween(input.asOfDate, candidate.expirationDate);
      const rollCashFlow = Number((candidate.bid - currentCloseDebit).toFixed(2));
      const realizedClosePnl = currentUnrealizedPnl;
      const netCredits = input.entryCredit + rollCashFlow;
      const expected = expectedMove(input.underlyingPrice, candidate.impliedVolatility, daysToExpiration);
      const boundary = type === "call" ? candidate.strike - expected : candidate.strike + expected;
      const strikeDistance = type === "call"
        ? (candidate.strike - input.underlyingPrice) / Math.max(expected, 0.01)
        : (input.underlyingPrice - candidate.strike) / Math.max(expected, 0.01);
      const deltaReduction = Math.max(0, Math.abs(current.delta) - Math.abs(candidate.delta));
      const liquidity = clamp(
        candidate.volume / 75 * 25 + candidate.openInterest / 250 * 25 + (18 - bidAskSpreadPct(candidate)) / 18 * 50,
        0,
        100
      );
      const targetDeltaScore = 1 - clamp((Math.abs(candidate.delta) - 0.27) / 0.27, 0, 1);
      const creditScore = clamp((rollCashFlow + Math.max(currentCloseDebit * 0.25, 0.25)) / Math.max(currentCloseDebit, 1), 0, 1);
      const score = clamp(
        100 * (0.28 * clamp(strikeDistance / 1.25, 0, 1) + 0.24 * deltaReduction + 0.18 * targetDeltaScore + 0.16 * creditScore + 0.14 * (liquidity / 100)),
        0,
        100
      );
      const rationale = [
        `${daysToExpiration} DTE extends time beyond the current ${currentDte} DTE contract.`,
        `${Math.abs(candidate.delta).toFixed(2)} absolute delta reduces directional exposure by ${deltaReduction.toFixed(2)}.`,
        `${strikeDistance.toFixed(2)} expected moves ${type === "call" ? "above" : "below"} spot.`,
        rollCashFlow >= 0 ? `Produces a $${rollCashFlow.toFixed(2)} credit per share before fees.` : `Requires a $${Math.abs(rollCashFlow).toFixed(2)} debit per share before fees.`
      ];

      return {
        contract: candidate,
        daysToExpiration,
        rollCashFlow,
        rollCashFlowDollars: perContract(rollCashFlow, contracts),
        realizedClosePnl,
        netCreditAfterRoll: perContract(netCredits, contracts),
        adjustedBreakeven: adjustedBreakeven(type, candidate.strike, netCredits),
        expectedMove: Number(expected.toFixed(2)),
        expectedMoveBoundary: Number(boundary.toFixed(2)),
        deltaReduction: Number(deltaReduction.toFixed(3)),
        liquidityScore: Math.round(liquidity),
        score: Number(score.toFixed(1)),
        rationale
      };
    })
    .filter((candidate) => input.allowDebitRoll || candidate.rollCashFlow >= 0)
    .sort((left, right) => right.score - left.score || right.rollCashFlow - left.rollCashFlow);

  if (currentDte <= 7) warnings.push("The current contract has 7 DTE or less; assignment and gap risk can make a roll difficult.");
  if (Math.abs(current.delta) >= 0.75) warnings.push("The current short option is deep ITM. Rolling realizes the existing loss and does not guarantee recovery.");
  if (!candidates.length) warnings.push("No liquid, safer-strike credit roll met the current filters. Consider allowing a debit roll or closing the position.");

  return {
    type,
    currentCloseDebit,
    currentUnrealizedPnl,
    candidates,
    recommendation: candidates[0] ?? null,
    warnings
  };
}
