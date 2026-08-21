export function preservedPortfolioIncome({
  portfolioValue,
  annualReturnRate,
  inflationRate
}: {
  portfolioValue: number;
  annualReturnRate: number;
  inflationRate: number;
}) {
  if (
    !Number.isFinite(portfolioValue) ||
    !Number.isFinite(annualReturnRate) ||
    !Number.isFinite(inflationRate) ||
    portfolioValue < 0
  ) {
    return null;
  }

  const grossAnnualReturn = portfolioValue * (annualReturnRate / 100);
  const inflationReserve = portfolioValue * (inflationRate / 100);
  const availableAfterInflation = grossAnnualReturn - inflationReserve;
  const annualIncome = Math.max(0, availableAfterInflation);
  const requiredClosingBalance = portfolioValue + inflationReserve;
  const closingBalanceAfterIncome = portfolioValue + grossAnnualReturn - annualIncome;

  return {
    annualIncome,
    monthlyIncome: annualIncome / 12,
    grossAnnualReturn,
    inflationReserve,
    incomeRate: portfolioValue > 0 ? (annualIncome / portfolioValue) * 100 : 0,
    requiredClosingBalance,
    closingBalanceAfterIncome,
    preservesPurchasingPower: closingBalanceAfterIncome >= requiredClosingBalance
  };
}
