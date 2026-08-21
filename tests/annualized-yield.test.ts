import { describe, expect, it } from "vitest";
import {
  calculateAnnualizedYield,
  recommendationCollateral
} from "@/lib/trading/annualized-yield";

describe("annualized collateral yield", () => {
  it("compounds a cash-secured put's credit over its holding period", () => {
    const result = calculateAnnualizedYield({
      credit: 1203,
      collateral: 43_000,
      openedAt: "2026-08-21T14:30:00.000Z",
      expirationDate: "2026-09-18"
    });

    expect(result?.holdingDays).toBe(28);
    expect(result?.periodYieldPct).toBeCloseTo(2.7977, 3);
    expect(result?.annualizedYieldPct).toBeCloseTo(43.29, 1);
  });

  it("uses strike collateral for cash-secured puts and stock value for covered calls", () => {
    expect(
      recommendationCollateral({
        strategyType: "cash_secured_put",
        strikePrice: 430,
        underlyingPrice: 455,
        maxRisk: 41_797
      })
    ).toBe(43_000);
    expect(
      recommendationCollateral({
        strategyType: "covered_call",
        strikePrice: 470,
        underlyingPrice: 455,
        maxRisk: 44_297
      })
    ).toBe(45_500);
  });
});
