export const FIRST_CPI_YEAR = 1913;
export const LAST_COMPLETE_CPI_YEAR = 2025;
export const LATEST_CPI_YEAR = 2026;
export const MAX_PROJECTION_YEAR = 2100;

// CPI-U, U.S. city average, all items. Completed years are annual averages.
// The current year uses the latest available monthly observation.
const CPI_VALUES = [
  9.883, 10.017, 10.108, 10.883, 12.825, 15.042, 17.333, 20.042, 17.85, 16.75,
  17.05, 17.125, 17.542, 17.7, 17.358, 17.158, 17.158, 16.7, 15.208, 13.642,
  12.933, 13.383, 13.725, 13.867, 14.383, 14.092, 13.908, 14.008, 14.725, 16.333,
  17.308, 17.592, 17.992, 19.517, 22.325, 24.042, 23.808, 24.067, 25.958, 26.55,
  26.767, 26.85, 26.775, 27.183, 28.092, 28.858, 29.15, 29.575, 29.892, 30.25,
  30.625, 31.017, 31.508, 32.458, 33.358, 34.783, 36.683, 38.825, 40.492, 41.817,
  44.4, 49.308, 53.817, 56.908, 60.608, 65.233, 72.575, 82.408, 90.925, 96.5,
  99.6, 103.883, 107.567, 109.608, 113.625, 118.258, 123.967, 130.658, 136.192,
  140.317, 144.458, 148.225, 152.383, 156.85, 160.517, 163.008, 166.575, 172.2,
  177.067, 179.875, 183.958, 188.883, 195.292, 201.592, 207.342, 215.303, 214.537,
  218.055, 224.939, 229.594, 232.957, 236.736, 237.017, 240.007, 245.12, 251.107,
  255.657, 258.811, 270.97, 292.655, 304.702, 313.689, 321.943, 333.918
] as const;

export const CPI_BY_YEAR = Object.fromEntries(
  CPI_VALUES.map((value, index) => [FIRST_CPI_YEAR + index, value])
) as Record<number, number>;

export function completedCpi(year: number) {
  return CPI_BY_YEAR[year] ?? null;
}

export function annualizedInflationRate(fromYear: number, toYear: number) {
  const fromCpi = completedCpi(fromYear);
  const toCpi = completedCpi(toYear);
  if (!fromCpi || !toCpi || fromYear === toYear) return 0;
  return (Math.pow(toCpi / fromCpi, 1 / (toYear - fromYear)) - 1) * 100;
}

export const LONG_RUN_INFLATION_RATE = annualizedInflationRate(
  FIRST_CPI_YEAR,
  LAST_COMPLETE_CPI_YEAR
);

export const RECENT_INFLATION_RATE = annualizedInflationRate(
  LAST_COMPLETE_CPI_YEAR - 20,
  LAST_COMPLETE_CPI_YEAR
);

export function cpiForYear(
  year: number,
  futureInflationRate: number,
  latestCpi = completedCpi(LATEST_CPI_YEAR)
) {
  if (year < LATEST_CPI_YEAR) return completedCpi(year);
  if (year === LATEST_CPI_YEAR) return latestCpi;
  const currentCpi = latestCpi;
  if (!currentCpi) return null;
  return currentCpi * Math.pow(1 + futureInflationRate / 100, year - LATEST_CPI_YEAR);
}

export function equivalentValue({
  amount,
  fromYear,
  toYear,
  futureInflationRate,
  latestCpi
}: {
  amount: number;
  fromYear: number;
  toYear: number;
  futureInflationRate: number;
  latestCpi?: number;
}) {
  const fromCpi = cpiForYear(fromYear, futureInflationRate, latestCpi);
  const toCpi = cpiForYear(toYear, futureInflationRate, latestCpi);
  if (!fromCpi || !toCpi || !Number.isFinite(amount)) return null;

  const multiplier = toCpi / fromCpi;
  return {
    value: amount * multiplier,
    multiplier,
    cumulativeChangePct: (multiplier - 1) * 100
  };
}

export function inflationTimeline({
  amount,
  fromYear,
  toYear,
  futureInflationRate,
  latestCpi
}: {
  amount: number;
  fromYear: number;
  toYear: number;
  futureInflationRate: number;
  latestCpi?: number;
}) {
  const firstYear = Math.min(fromYear, toYear);
  const lastYear = Math.max(fromYear, toYear);

  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index;
    const result = equivalentValue({
      amount,
      fromYear,
      toYear: year,
      futureInflationRate,
      latestCpi
    });
    const value = result?.value ?? 0;
    return {
      year,
      actual: year <= LATEST_CPI_YEAR ? value : null,
      projected: year >= LATEST_CPI_YEAR ? value : null
    };
  });
}
