function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0) {
  return Math.max(toNumber(value), min);
}

function monthlyPayment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const growth = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * growth) / (growth - 1));
}

export function calculateCarLeaseVsBuy(inputs) {
  const carPrice = clamp(inputs.carPrice);
  const leaseMonthlyPayment = clamp(inputs.leaseMonthlyPayment);
  const leaseTermMonths = Math.round(clamp(inputs.leaseTermMonths, 1));
  const loanInterestRate = clamp(inputs.loanInterestRate);
  const annualMaintenance = clamp(inputs.annualMaintenance);
  const depreciationRate = clamp(inputs.depreciationRate);
  const years = clamp(inputs.years || leaseTermMonths / 12, 1);

  const buyMonths = Math.round(years * 12);
  const buyLoanPayment = monthlyPayment(carPrice, loanInterestRate, buyMonths);
  const totalBuyPayments = buyLoanPayment * buyMonths;
  const totalBuyMaintenance = annualMaintenance * years;
  const ownershipValue = carPrice * Math.pow(1 - depreciationRate / 100, years);
  const totalBuyCost = totalBuyPayments + totalBuyMaintenance - ownershipValue;

  const leaseCycles = Math.ceil(buyMonths / leaseTermMonths);
  const totalLeasePayments = leaseCycles * leaseTermMonths * leaseMonthlyPayment;
  const totalLeaseMaintenance = annualMaintenance * years * 0.5;
  const totalLeaseCost = totalLeasePayments + totalLeaseMaintenance;

  const winner = totalBuyCost <= totalLeaseCost ? 'buy' : 'lease';

  return {
    totalBuyCost,
    totalLeaseCost,
    ownershipValue,
    winner,
    recommendation: winner === 'buy'
      ? 'Buying is projected to cost less over the selected period.'
      : 'Leasing is projected to cost less over the selected period.',
  };
}

export function calculateChildcareVsStayHome(inputs) {
  const daycareCost = clamp(inputs.daycareCost);
  const parentSalary = clamp(inputs.parentSalary);
  const taxRate = clamp(inputs.taxRate);
  const careerGrowthRate = toNumber(inputs.careerGrowthRate, 0);
  const years = clamp(inputs.years || 5, 1);

  let postTaxCareerIncome = 0;
  let salary = parentSalary;

  for (let year = 1; year <= years; year += 1) {
    const net = salary * (1 - taxRate / 100);
    postTaxCareerIncome += net;
    salary *= 1 + careerGrowthRate / 100;
  }

  const totalDaycare = daycareCost * 12 * years;
  const netWithDaycare = postTaxCareerIncome - totalDaycare;
  const stayHomeNet = 0;
  const opportunityCost = postTaxCareerIncome;
  const winner = netWithDaycare >= stayHomeNet ? 'childcare' : 'stay-home';

  return {
    netWithDaycare,
    stayHomeNet,
    opportunityCost,
    winner,
    recommendation: winner === 'childcare'
      ? 'Working with childcare has a stronger net financial outcome.'
      : 'Staying home has a stronger net financial outcome for this scenario.',
  };
}
