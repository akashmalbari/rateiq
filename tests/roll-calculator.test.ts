import { describe, expect, it } from "vitest";
import { calculateShortOptionRolls } from "@/lib/trading/roll-calculator";
import type { OptionContract, OptionsChain } from "@/lib/trading/types";

function contract(overrides: Partial<OptionContract> = {}): OptionContract {
  return {
    symbol: "XYZ",
    underlyingSymbol: "XYZ",
    expirationDate: "2026-09-18",
    strike: 125,
    type: "call",
    bid: 8.5,
    ask: 9,
    volume: 1_000,
    openInterest: 3_000,
    impliedVolatility: 0.3,
    delta: 0.82,
    gamma: 0.02,
    theta: -0.12,
    vega: 0.2,
    ...overrides
  };
}

describe("short option roll calculator", () => {
  it("recommends a later, safer-strike liquid credit roll and exposes the realized loss", () => {
    const current = contract();
    const chain: OptionsChain = {
      underlyingSymbol: "XYZ",
      capturedAt: "2026-09-01T14:30:00.000Z",
      contracts: [
        current,
        contract({ symbol: "XYZ-140", expirationDate: "2026-10-16", strike: 140, bid: 9.7, ask: 10, delta: 0.28 }),
        contract({ symbol: "XYZ-135", expirationDate: "2026-10-16", strike: 135, bid: 10.2, ask: 10.7, delta: 0.43 }),
        contract({ symbol: "XYZ-120", expirationDate: "2026-10-16", strike: 120, bid: 13, ask: 13.5, delta: 0.9 }),
        contract({ symbol: "XYZ-145-illiquid", expirationDate: "2026-10-16", strike: 145, bid: 8, ask: 12, delta: 0.2, volume: 1, openInterest: 2 })
      ]
    };

    const result = calculateShortOptionRolls({
      underlyingPrice: 132,
      asOfDate: "2026-09-01",
      currentContract: current,
      entryCredit: 2,
      chain
    });

    expect(result.recommendation?.contract.symbol).toBe("XYZ-140");
    expect(result.recommendation?.rollCashFlow).toBe(0.7);
    expect(result.recommendation?.realizedClosePnl).toBe(-700);
    expect(result.recommendation?.netCreditAfterRoll).toBe(270);
    expect(result.recommendation?.adjustedBreakeven).toBe(142.7);
    expect(result.warnings).toContain("The current short option is deep ITM. Rolling realizes the existing loss and does not guarantee recovery.");
  });

  it("keeps debit rolls out unless explicitly enabled", () => {
    const current = contract({ ask: 9 });
    const chain: OptionsChain = {
      underlyingSymbol: "XYZ",
      capturedAt: "2026-09-01T14:30:00.000Z",
      contracts: [current, contract({ expirationDate: "2026-10-16", strike: 140, bid: 7, ask: 7.3, delta: 0.25 })]
    };
    const baseInput = { underlyingPrice: 132, asOfDate: "2026-09-01", currentContract: current, entryCredit: 2, chain };

    expect(calculateShortOptionRolls(baseInput).recommendation).toBeNull();
    expect(calculateShortOptionRolls({ ...baseInput, allowDebitRoll: true }).recommendation?.rollCashFlow).toBe(-2);
  });
});
