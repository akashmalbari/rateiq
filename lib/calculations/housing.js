function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampMin(value, min = 0) {
  return Math.max(toNumber(value), min);
}

function monthlyPayment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * growth) / (growth - 1));
}

export function calculateRentVsBuy(inputs) {
  const years = clampMin(inputs.years, 0);
  const homePrice = clampMin(inputs.homePrice, 0);
  const downPayment = Math.min(clampMin(inputs.downPayment, 0), homePrice);
  const rentPerMonth = clampMin(inputs.rentPerMonth, 0);
  const interestRate = clampMin(inputs.interestRate, 0);
  const propertyTaxRate = clampMin(inputs.propertyTaxRate, 0);
  const maintenanceRate = clampMin(inputs.maintenanceRate, 0);
  const annualRentIncrease = toNumber(inputs.annualRentIncrease, 0);
  const homeAppreciationRate = toNumber(inputs.homeAppreciationRate, 0);
  const investmentReturnRate = toNumber(inputs.investmentReturnRate, 0);

  const loanAmount = Math.max(homePrice - downPayment, 0);
  const mortgageMonths = 30 * 12;
  const heldMonths = Math.floor(years * 12);
  const payment = monthlyPayment(loanAmount, interestRate, mortgageMonths);
  const mortgageRateMonthly = interestRate / 100 / 12;
  const investRateMonthly = investmentReturnRate / 100 / 12;

  let balance = loanAmount;
  let totalInterest = 0;
  let yearlyRent = rentPerMonth * 12;
  let totalRentPaid = 0;
  let investmentBalance = downPayment;
  let breakEvenYear = null;

  for (let month = 1; month <= heldMonths; month += 1) {
    investmentBalance *= 1 + investRateMonthly;

    if (month <= mortgageMonths) {
      const interestPaid = mortgageRateMonthly === 0 ? 0 : balance * mortgageRateMonthly;
      const principalPaid = payment - interestPaid;
      totalInterest += interestPaid;
      balance = Math.max(0, balance - principalPaid);

      const taxMonthly = (homePrice * (propertyTaxRate / 100)) / 12;
      const maintenanceMonthly = (homePrice * (maintenanceRate / 100)) / 12;
      const ownMonthlyCost = payment + taxMonthly + maintenanceMonthly;
      const rentMonthlyNow = yearlyRent / 12;

      if (breakEvenYear === null && ownMonthlyCost <= rentMonthlyNow) {
        breakEvenYear = Math.ceil(month / 12);
      }

      const investContribution = Math.max(ownMonthlyCost - rentMonthlyNow, 0);
      investmentBalance += investContribution;
    }

    if (month % 12 === 0) {
      totalRentPaid += yearlyRent;
      yearlyRent *= 1 + annualRentIncrease / 100;
    }
  }

  const appreciatedHomeValue = homePrice * Math.pow(1 + homeAppreciationRate / 100, years);
  const equity = Math.max(appreciatedHomeValue - balance, 0);
  const taxAndMaintenanceCost = (homePrice * ((propertyTaxRate + maintenanceRate) / 100)) * years;
  const buyNetWorth = equity - taxAndMaintenanceCost - totalInterest;
  const rentNetWorth = Math.max(investmentBalance - totalRentPaid, 0);

  const diff = rentNetWorth - buyNetWorth;
  const recommendation = diff >= 0
    ? `Renting is better now. Buying may become better after year ${breakEvenYear || Math.max(Math.ceil(years), 1)}.`
    : 'Buying is financially stronger over this horizon.';

  return {
    rentNetWorth,
    buyNetWorth,
    breakEvenYear: breakEvenYear || null,
    totalRentPaid,
    totalInterest,
    appreciatedHomeValue,
    equity,
    difference: Math.abs(diff),
    winner: diff >= 0 ? 'rent' : 'buy',
    recommendation,
  };
}

export function calculateMortgageVsInvest(inputs) {
  const mortgageRate = clampMin(inputs.mortgageRate, 0);
  const remainingLoanAmount = clampMin(inputs.remainingLoanAmount, 0);
  const extraMonthlyPayment = clampMin(inputs.extraMonthlyPayment, 0);
  const expectedInvestmentReturn = toNumber(inputs.expectedInvestmentReturn, 0);
  const termYears = clampMin(inputs.termYears || 20, 1);

  const months = Math.round(termYears * 12);
  const basePayment = monthlyPayment(remainingLoanAmount, mortgageRate, months);
  const acceleratedPayment = basePayment + extraMonthlyPayment;

  let stdBalance = remainingLoanAmount;
  let fastBalance = remainingLoanAmount;
  let standardInterest = 0;
  let acceleratedInterest = 0;
  const monthlyRate = mortgageRate / 100 / 12;
  const investRate = expectedInvestmentReturn / 100 / 12;
  let investmentValue = 0;

  for (let month = 1; month <= months; month += 1) {
    if (stdBalance > 0) {
      const interest = monthlyRate === 0 ? 0 : stdBalance * monthlyRate;
      const principal = Math.min(basePayment - interest, stdBalance);
      standardInterest += interest;
      stdBalance = Math.max(0, stdBalance - principal);
    }

    if (fastBalance > 0) {
      const interest = monthlyRate === 0 ? 0 : fastBalance * monthlyRate;
      const principal = Math.min(acceleratedPayment - interest, fastBalance);
      acceleratedInterest += interest;
      fastBalance = Math.max(0, fastBalance - principal);
    }

    investmentValue = (investmentValue + extraMonthlyPayment) * (1 + investRate);
  }

  const interestSaved = Math.max(standardInterest - acceleratedInterest, 0);
  const gainsFromInvesting = Math.max(investmentValue - extraMonthlyPayment * months, 0);
  const winner = gainsFromInvesting >= interestSaved ? 'invest' : 'mortgage';

  return {
    interestSaved,
    gainsFromInvesting,
    winner,
    recommendation: winner === 'invest'
      ? 'Investing extra cash is projected to outperform early mortgage payoff.'
      : 'Paying down mortgage is projected to outperform investing extra cash.',
  };
}
