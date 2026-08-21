import { describe, expect, it } from "vitest";
import {
  FIRST_CPI_YEAR,
  LATEST_CPI_YEAR,
  LONG_RUN_INFLATION_RATE,
  RECENT_INFLATION_RATE,
  completedCpi,
  equivalentValue
} from "@/lib/inflation/cpi-data";

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
});
