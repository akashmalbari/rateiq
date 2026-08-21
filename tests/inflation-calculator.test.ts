import { describe, expect, it } from "vitest";
import {
  FIRST_CPI_YEAR,
  LATEST_CPI_YEAR,
  LONG_RUN_INFLATION_RATE,
  RECENT_INFLATION_RATE,
  completedCpi,
  equivalentValue
} from "@/lib/inflation/cpi-data";
import { preservedPortfolioIncome } from "@/lib/inflation/portfolio-projection";

describe("inflation calculator", () => {
  it("contains the official annual CPI range and latest partial year", () => {
    expect(completedCpi(FIRST_CPI_YEAR)).toBe(9.883);
    expect(completedCpi(2025)).toBe(321.943);
    expect(completedCpi(LATEST_CPI_YEAR)).toBe(333.918);
  });

  it("converts historical dollars with the CPI ratio", () => {
    const result = equivalentValue({
      amount: 100,
      fromYear: 1913,
      toYear: 2025,
      futureInflationRate: LONG_RUN_INFLATION_RATE
    });

    expect(result?.value).toBeCloseTo(3257.54, 1);
    expect(result?.multiplier).toBeCloseTo(32.575, 2);
  });

  it("projects future years without producing invalid values", () => {
    const result = equivalentValue({
      amount: 6000,
      fromYear: 2026,
      toYear: 2056,
      futureInflationRate: 3
    });

    expect(result?.value).toBeCloseTo(14_563.57, 0);
    expect(Number.isFinite(result?.value)).toBe(true);
  });

  it("derives sensible historical projection presets", () => {
    expect(LONG_RUN_INFLATION_RATE).toBeGreaterThan(3);
    expect(LONG_RUN_INFLATION_RATE).toBeLessThan(3.3);
    expect(RECENT_INFLATION_RATE).toBeGreaterThan(2);
    expect(RECENT_INFLATION_RATE).toBeLessThan(3);
  });

  it("calculates income while preserving the portfolio's purchasing power", () => {
    const result = preservedPortfolioIncome({
      portfolioValue: 1_000_000,
      annualReturnRate: 7,
      inflationRate: 3
    });

    expect(result?.grossAnnualReturn).toBe(70_000);
    expect(result?.inflationReserve).toBe(30_000);
    expect(result?.annualIncome).toBe(40_000);
    expect(result?.monthlyIncome).toBeCloseTo(3_333.33, 2);
    expect(result?.closingBalanceAfterIncome).toBe(1_030_000);
    expect(result?.preservesPurchasingPower).toBe(true);
  });

  it("does not show spendable income when returns trail inflation", () => {
    const result = preservedPortfolioIncome({
      portfolioValue: 1_000_000,
      annualReturnRate: 2,
      inflationRate: 3
    });

    expect(result?.annualIncome).toBe(0);
    expect(result?.closingBalanceAfterIncome).toBe(1_020_000);
    expect(result?.requiredClosingBalance).toBe(1_030_000);
    expect(result?.preservesPurchasingPower).toBe(false);
  });

  it("increases the projected balance and income for a later target year", () => {
    const fiveYears = preservedPortfolioIncome({
      portfolioValue: 1_000_000,
      annualReturnRate: 7,
      inflationRate: 3,
      projectionYears: 5
    });
    const twentyYears = preservedPortfolioIncome({
      portfolioValue: 1_000_000,
      annualReturnRate: 7,
      inflationRate: 3,
      projectionYears: 20
    });

    expect(fiveYears?.targetPortfolioValue).toBeCloseTo(1_402_551.73, 2);
    expect(fiveYears?.annualIncome).toBeCloseTo(56_102.07, 2);
    expect(twentyYears?.targetPortfolioValue).toBeGreaterThan(fiveYears?.targetPortfolioValue ?? 0);
    expect(twentyYears?.annualIncome).toBeGreaterThan(fiveYears?.annualIncome ?? 0);
  });
});
