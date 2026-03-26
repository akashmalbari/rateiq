function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0) {
  return Math.max(toNumber(value), min);
}

export function calculateInvestVsDebt(inputs) {
  const debtInterestRate = clamp(inputs.debtInterestRate);
  const investmentReturn = toNumber(inputs.investmentReturn, 0);
  const extraMonthlyCash = clamp(inputs.extraMonthlyCash);
  const years = clamp(inputs.years || 10, 1);

  const months = Math.round(years * 12);
  const debtMonthlyRate = debtInterestRate / 100 / 12;
  const investMonthlyRate = investmentReturn / 100 / 12;

  const debtSavings = extraMonthlyCash * months * debtMonthlyRate;
  let investmentValue = 0;
  for (let i = 0; i < months; i += 1) {
    investmentValue = (investmentValue + extraMonthlyCash) * (1 + investMonthlyRate);
  }
  const investmentGain = investmentValue - extraMonthlyCash * months;

  const netGain = investmentGain - debtSavings;

  return {
    debtSavings,
    investmentGain,
    netGain,
    winner: netGain >= 0 ? 'invest' : 'debt',
    recommendation: netGain >= 0
      ? 'Investing extra cash is projected to create higher net gains.'
      : 'Paying off debt first is projected to create higher net gains.',
  };
}

export function calculateRetirementProjection(inputs) {
  const currentSavings = clamp(inputs.currentSavings);
  const monthlyContribution = clamp(inputs.monthlyContribution);
  const expectedReturn = toNumber(inputs.expectedReturn, 0);
  const currentAge = clamp(inputs.currentAge || 35, 0);
  const retirementAge = clamp(inputs.retirementAge || 65, currentAge);

  const years = Math.max(retirementAge - currentAge, 0);
  const months = years * 12;
  const monthlyRate = expectedReturn / 100 / 12;

  let futureValue = currentSavings;
  for (let i = 0; i < months; i += 1) {
    futureValue = (futureValue + monthlyContribution) * (1 + monthlyRate);
  }

  const monthlyIncomeEstimate = futureValue * 0.04 / 12;

  return {
    yearsToRetirement: years,
    futureValue,
    monthlyIncomeEstimate,
  };
}

export function calculateLumpSumVsDca(inputs) {
  const investmentAmount = clamp(inputs.investmentAmount);
  const frequencyPerYear = Math.max(Math.round(clamp(inputs.frequencyPerYear || 12, 1)), 1);
  const annualReturn = toNumber(inputs.annualReturn, 0);
  const years = clamp(inputs.years || 10, 1);
  const riskPenaltyPercent = clamp(inputs.riskPenaltyPercent || 1.5, 0);

  const lumpSumValue = investmentAmount * Math.pow(1 + annualReturn / 100, years);

  const totalPeriods = Math.round(years * frequencyPerYear);
  const periodRate = annualReturn / 100 / frequencyPerYear;
  const contribution = investmentAmount / totalPeriods;
  let dcaValue = 0;
  for (let i = 0; i < totalPeriods; i += 1) {
    dcaValue = (dcaValue + contribution) * (1 + periodRate);
  }

  const lumpRiskAdjusted = lumpSumValue * (1 - riskPenaltyPercent / 100);
  const dcaRiskAdjusted = dcaValue;

  return {
    lumpSumValue,
    dcaValue,
    lumpRiskAdjusted,
    dcaRiskAdjusted,
    winner: dcaRiskAdjusted > lumpRiskAdjusted ? 'dca' : 'lump-sum',
    recommendation: dcaRiskAdjusted > lumpRiskAdjusted
      ? 'DCA shows a stronger risk-adjusted outcome under these assumptions.'
      : 'Lump sum shows a stronger risk-adjusted outcome under these assumptions.',
  };
}
