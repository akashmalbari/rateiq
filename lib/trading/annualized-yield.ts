import type { Recommendation } from "@/lib/trading/types";

const MILLISECONDS_PER_DAY = 86_400_000;

function utcDateValue(value: string) {
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function recommendationCollateral(
  recommendation: Pick<
    Recommendation,
    "strategyType" | "strikePrice" | "underlyingPrice" | "maxRisk"
  >
) {
  if (recommendation.strategyType === "cash_secured_put") {
    return recommendation.strikePrice * 100;
  }

  if (recommendation.strategyType === "covered_call") {
    return recommendation.underlyingPrice * 100;
  }

  return recommendation.maxRisk;
}

export function calculateAnnualizedYield({
  credit,
  collateral,
  openedAt,
  expirationDate
}: {
  credit: number;
  collateral: number;
  openedAt: string;
  expirationDate: string;
}) {
  if (credit <= 0 || collateral <= 0) return null;

  const holdingDays = Math.max(
    1,
    Math.ceil((utcDateValue(expirationDate) - utcDateValue(openedAt)) / MILLISECONDS_PER_DAY)
  );
  const periodYield = credit / collateral;
  const annualizedYieldPct = (Math.pow(1 + periodYield, 365 / holdingDays) - 1) * 100;

  return {
    holdingDays,
    collateral,
    periodYieldPct: periodYield * 100,
    annualizedYieldPct
  };
}
