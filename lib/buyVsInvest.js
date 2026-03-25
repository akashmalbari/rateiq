// @ts-check

/**
 * @typedef {Object} BuyVsInvestInputs
 * @property {number} homePrice
 * @property {number} downPayment
 * @property {number} interestRate
 * @property {number} loanTermYears
 * @property {number} expectedReturnRate
 * @property {number} yearsHeld
 * @property {number} [propertyAppreciationRate]
 */

/**
 * @typedef {Object} BuyVsInvestResult
 * @property {number} loanAmount
 * @property {number} monthlyMortgagePayment
 * @property {number} totalCostOfOwning
 * @property {number} totalInterestPaid
 * @property {number} appreciatedHomeValue
 * @property {number} propertyAppreciationGain
 * @property {number} propertyAppreciationRateUsed
 * @property {number} homeEquityAfterYearsHeld
 * @property {number} remainingMortgageBalance
 * @property {number} futureValueOfInvesting
 * @property {number} netDifference
 * @property {'invest' | 'buy'} winner
 * @property {string} decisionMessage
 */

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function normalizeLoanMonths(years) {
  if (years <= 0) {
    return 0;
  }

  // A positive loan term should always produce at least one payment period.
  return Math.max(1, Math.round(years * 12));
}

function normalizeHeldMonths(years) {
  if (years <= 0) {
    return 0;
  }

  // For holding periods, count completed months only so we do not overstate
  // interest, equity, or investment growth on a partial month.
  return Math.floor(years * 12);
}

function calculateMonthlyMortgagePayment(principal, annualRate, totalMonths) {
  if (principal <= 0 || totalMonths <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return principal / totalMonths;
  }

  // Standard fixed-rate mortgage payment formula:
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  // where P = principal, r = monthly rate, n = total monthly payments.
  const growthFactor = Math.pow(1 + monthlyRate, totalMonths);
  return principal * ((monthlyRate * growthFactor) / (growthFactor - 1));
}

/**
 * @param {BuyVsInvestInputs} inputs
 * @returns {BuyVsInvestResult}
 */
export function calculateBuyVsInvest(inputs) {
  const homePrice = Math.max(Number(inputs.homePrice) || 0, 0);
  const downPayment = Math.max(Number(inputs.downPayment) || 0, 0);
  const interestRate = Math.max(Number(inputs.interestRate) || 0, 0);
  const loanTermYears = Math.max(Number(inputs.loanTermYears) || 0, 0);
  const expectedReturnRate = Number(inputs.expectedReturnRate) || 0;
  const yearsHeld = Math.max(Number(inputs.yearsHeld) || 0, 0);
  const propertyAppreciationRate = Number.isFinite(Number(inputs.propertyAppreciationRate))
    ? Number(inputs.propertyAppreciationRate)
    : 0;

  const safeDownPayment = Math.min(Math.max(downPayment, 0), homePrice);
  const loanAmount = Math.max(homePrice - safeDownPayment, 0);
  const totalLoanMonths = normalizeLoanMonths(loanTermYears);
  const totalHeldMonths = normalizeHeldMonths(yearsHeld);
  const mortgageMonthsPaid = Math.min(totalHeldMonths, totalLoanMonths);
  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(loanAmount, interestRate, totalLoanMonths);

  const monthlyMortgageRate = interestRate / 100 / 12;
  const monthlyInvestmentRate = expectedReturnRate / 100 / 12;

  let remainingMortgageBalance = loanAmount;
  let totalInterestPaid = 0;
  let totalMortgagePaid = 0;
  let investmentBalance = safeDownPayment;

  for (let month = 0; month < totalHeldMonths; month += 1) {
    // Compound the investment once per month. The down payment starts invested
    // immediately, and the "same money" as the mortgage payment is added at the
    // end of each month, which matches an ordinary annuity contribution pattern.
    investmentBalance *= 1 + monthlyInvestmentRate;

    if (month < mortgageMonthsPaid) {
      const interestPaid = monthlyMortgageRate === 0
        ? 0
        : remainingMortgageBalance * monthlyMortgageRate;
      const principalPaid = monthlyMortgagePayment - interestPaid;

      totalInterestPaid += interestPaid;
      totalMortgagePaid += monthlyMortgagePayment;
      remainingMortgageBalance = Math.max(0, remainingMortgageBalance - principalPaid);
      investmentBalance += monthlyMortgagePayment;
    }
  }

  if (totalHeldMonths === 0) {
    investmentBalance = safeDownPayment;
  }

  const totalCostOfOwning = safeDownPayment + totalMortgagePaid;
  // Apply area appreciation to the original purchase price using annual
  // compounding so the ending home value reflects the selected market.
  const appreciatedHomeValue = homePrice * Math.pow(1 + (propertyAppreciationRate / 100), yearsHeld);
  const propertyAppreciationGain = appreciatedHomeValue - homePrice;
  const homeEquityAfterYearsHeld = Math.max(appreciatedHomeValue - remainingMortgageBalance, 0);
  const rawDifference = investmentBalance - homeEquityAfterYearsHeld;
  const winner = rawDifference >= 0 ? 'invest' : 'buy';
  const netDifference = Math.abs(rawDifference);
  const decisionMessage = winner === 'invest'
    ? `Investing beats buying by $${Math.round(netDifference).toLocaleString()}`
    : `Buying builds more wealth by $${Math.round(netDifference).toLocaleString()}`;

  return {
    loanAmount: roundCurrency(loanAmount),
    monthlyMortgagePayment: roundCurrency(monthlyMortgagePayment),
    totalCostOfOwning: roundCurrency(totalCostOfOwning),
    totalInterestPaid: roundCurrency(totalInterestPaid),
    appreciatedHomeValue: roundCurrency(appreciatedHomeValue),
    propertyAppreciationGain: roundCurrency(propertyAppreciationGain),
    propertyAppreciationRateUsed: roundCurrency(propertyAppreciationRate),
    homeEquityAfterYearsHeld: roundCurrency(homeEquityAfterYearsHeld),
    remainingMortgageBalance: roundCurrency(remainingMortgageBalance),
    futureValueOfInvesting: roundCurrency(investmentBalance),
    netDifference: roundCurrency(netDifference),
    winner,
    decisionMessage,
  };
}
