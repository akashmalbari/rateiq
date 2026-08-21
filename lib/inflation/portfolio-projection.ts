export function preservedPortfolioIncome({
  portfolioValue,
  annualReturnRate,
  inflationRate,
  projectionYears = 0
}: {
  portfolioValue: number;
  annualReturnRate: number;
  inflationRate: number;
  projectionYears?: number;
}) {
  if (
    !Number.isFinite(portfolioValue) ||
    !Number.isFinite(annualReturnRate) ||
    !Number.isFinite(inflationRate) ||
    !Number.isFinite(projectionYears) ||
    portfolioValue < 0 ||
    projectionYears < 0
  ) {
    return null;
  }

  const targetPortfolioValue = portfolioValue * Math.pow(1 + annualReturnRate / 100, projectionYears);
  const grossAnnualReturn = targetPortfolioValue * (annualReturnRate / 100);
  const inflationReserve = targetPortfolioValue * (inflationRate / 100);
  const availableAfterInflation = grossAnnualReturn - inflationReserve;
  const annualIncome = Math.max(0, availableAfterInflation);
  const requiredClosingBalance = targetPortfolioValue + inflationReserve;
  const closingBalanceAfterIncome = targetPortfolioValue + grossAnnualReturn - annualIncome;

  return {
    startingPortfolioValue: portfolioValue,
    projectionYears,
    targetPortfolioValue,
    annualIncome,
    monthlyIncome: annualIncome / 12,
    grossAnnualReturn,
    inflationReserve,
    incomeRate: targetPortfolioValue > 0 ? (annualIncome / targetPortfolioValue) * 100 : 0,
    requiredClosingBalance,
    closingBalanceAfterIncome,
    preservesPurchasingPower: closingBalanceAfterIncome >= requiredClosingBalance
  };
}

export function portfolioGrowthTimeline({
  portfolioValue,
  fromYear,
  toYear,
  annualReturnRate
}: {
  portfolioValue: number;
  fromYear: number;
  toYear: number;
  annualReturnRate: number;
}) {
  return Array.from({ length: Math.max(0, toYear - fromYear) + 1 }, (_, index) => ({
    year: fromYear + index,
    actual: null,
    projected: portfolioValue * Math.pow(1 + annualReturnRate / 100, index)
  }));
}
