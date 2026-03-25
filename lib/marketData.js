// lib/marketData.js
// Fetches from FRED (free, no key needed for basic series)
// and uses realistic static fallbacks for MVP

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_KEY  = process.env.FRED_API_KEY || 'DEMO'; // works for basic reads

// FRED series IDs
const SERIES = {
  mortgage30: 'MORTGAGE30US',
  mortgage15: 'MORTGAGE15US',
  fedFunds:   'FEDFUNDS',
  cpi:        'CPIAUCSL',
  sp500:      'SP500',
};

async function fetchFREDSeries(seriesId) {
  try {
    const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=2`;
    const res  = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('FRED fetch failed');
    const data = await res.json();
    const obs  = data.observations?.filter(o => o.value !== '.') || [];
    return obs[0]?.value ? parseFloat(obs[0].value) : null;
  } catch {
    return null;
  }
}

// Real estate appreciation by metro — sourced from Zillow/FHFA historical averages
// For MVP these are realistic static values; Phase 2 replaces with live Zillow API
export const REAL_ESTATE_MARKETS = [
  { city: 'Austin, TX',        region: 'South',     annualAppreciation: 4.2, medianHome: 525000, rentYield: 3.8 },
  { city: 'Miami, FL',         region: 'South',     annualAppreciation: 6.1, medianHome: 620000, rentYield: 4.1 },
  { city: 'Nashville, TN',     region: 'South',     annualAppreciation: 5.3, medianHome: 430000, rentYield: 4.4 },
  { city: 'Phoenix, AZ',       region: 'West',      annualAppreciation: 4.8, medianHome: 410000, rentYield: 4.2 },
  { city: 'Denver, CO',        region: 'West',      annualAppreciation: 4.5, medianHome: 550000, rentYield: 3.6 },
  { city: 'Seattle, WA',       region: 'West',      annualAppreciation: 5.1, medianHome: 710000, rentYield: 3.3 },
  { city: 'San Francisco, CA', region: 'West',      annualAppreciation: 3.9, medianHome: 1150000,rentYield: 2.8 },
  { city: 'New York, NY',      region: 'Northeast', annualAppreciation: 3.7, medianHome: 780000, rentYield: 3.1 },
  { city: 'Boston, MA',        region: 'Northeast', annualAppreciation: 4.4, medianHome: 690000, rentYield: 3.4 },
  { city: 'Philadelphia, PA',  region: 'Northeast', annualAppreciation: 3.8, medianHome: 310000, rentYield: 5.1 },
  { city: 'Chicago, IL',       region: 'Midwest',   annualAppreciation: 3.2, medianHome: 310000, rentYield: 5.6 },
  { city: 'Columbus, OH',      region: 'Midwest',   annualAppreciation: 4.0, medianHome: 270000, rentYield: 5.8 },
  { city: 'Minneapolis, MN',   region: 'Midwest',   annualAppreciation: 3.5, medianHome: 340000, rentYield: 5.2 },
  { city: 'Dallas, TX',        region: 'South',     annualAppreciation: 4.6, medianHome: 380000, rentYield: 4.8 },
  { city: 'Charlotte, NC',     region: 'South',     annualAppreciation: 5.5, medianHome: 370000, rentYield: 4.6 },
];

// Index funds — static for MVP, Phase 2 replaces with Alpha Vantage / Yahoo Finance
export const INDEX_FUNDS = [
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    index: 'S&P 500',
    expenseRatio: 0.03,
    historicReturn10yr: 12.8,
    historicReturn5yr:  14.6,
    historicReturn1yr:  24.2,
    risk: 'Moderate',
    description: 'Tracks the 500 largest US companies. The gold standard of index investing.',
  },
  {
    ticker: 'QQQ',
    name: 'Invesco NASDAQ-100 ETF',
    index: 'NASDAQ-100',
    expenseRatio: 0.20,
    historicReturn10yr: 17.9,
    historicReturn5yr:  18.2,
    historicReturn1yr:  28.6,
    risk: 'Moderate-High',
    description: 'Top 100 non-financial NASDAQ companies. Tech-heavy, higher volatility.',
  },
  {
    ticker: 'VTI',
    name: 'Vanguard Total Market ETF',
    index: 'US Total Market',
    expenseRatio: 0.03,
    historicReturn10yr: 12.2,
    historicReturn5yr:  13.9,
    historicReturn1yr:  23.5,
    risk: 'Moderate',
    description: 'Entire US stock market in one fund — 3,700+ companies.',
  },
  {
    ticker: 'VXUS',
    name: 'Vanguard Total International',
    index: 'International',
    expenseRatio: 0.07,
    historicReturn10yr: 5.2,
    historicReturn5yr:  7.8,
    historicReturn1yr:  11.4,
    risk: 'Moderate',
    description: 'Diversification outside the US. Lower returns, lower correlation to US market.',
  },
  {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market',
    index: 'US Bonds',
    expenseRatio: 0.03,
    historicReturn10yr: 1.6,
    historicReturn5yr:  0.2,
    historicReturn1yr:  4.7,
    risk: 'Low',
    description: 'Stability and income. Good ballast for your portfolio during market drops.',
  },
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    index: 'REITs',
    expenseRatio: 0.12,
    historicReturn10yr: 8.1,
    historicReturn5yr:  4.3,
    historicReturn1yr:  7.9,
    risk: 'Moderate',
    description: 'Real estate exposure without buying property. Tracks commercial REITs.',
  },
];

export async function getLiveRates() {
  const [mortgage30, mortgage15, fedFunds] = await Promise.all([
    fetchFREDSeries(SERIES.mortgage30),
    fetchFREDSeries(SERIES.mortgage15),
    fetchFREDSeries(SERIES.fedFunds),
  ]);

  return {
    mortgage30: mortgage30 ?? 6.87,
    mortgage15: mortgage15 ?? 6.15,
    fedFunds:   fedFunds   ?? 5.33,
    prime:      (fedFunds ?? 5.33) + 3,   // Prime = Fed Funds + 3
    sofr:       (fedFunds ?? 5.33) - 0.1, // Approx
    lastUpdated: new Date().toISOString(),
  };
}

// Amortization schedule generator
export function buildAmortizationSchedule(principal, annualRate, termYears) {
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) /
                  (Math.pow(1 + monthlyRate, n) - 1);

  let balance = principal;
  const schedule = [];
  let totalInterest = 0;

  for (let month = 1; month <= n; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = payment - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;

    if (month % 12 === 0 || month === 1 || month === n) {
      schedule.push({
        month,
        year: Math.ceil(month / 12),
        payment: Math.round(payment),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.max(0, Math.round(balance)),
        totalInterestPaid: Math.round(totalInterest),
      });
    }
  }

  return {
    monthlyPayment: Math.round(payment),
    totalPaid: Math.round(payment * n),
    totalInterest: Math.round(totalInterest),
    schedule,
  };
}

// Buy vs Invest comparison engine
export function compareBuyVsInvest({
  capital,
  downPaymentPct,
  homePrice,
  mortgageRate,
  termYears,
  holdYears,
  marketAppreciation,
  investmentReturn,
  rentMonthly,
}) {
  // --- REAL ESTATE SCENARIO ---
  const downPayment  = homePrice * (downPaymentPct / 100);
  const loanAmt      = homePrice - downPayment;
  const amort        = buildAmortizationSchedule(loanAmt, mortgageRate, termYears);
  const monthlyPITI  = amort.monthlyPayment * 1.25; // + taxes/insurance est.
  const futureHomeVal = homePrice * Math.pow(1 + marketAppreciation / 100, holdYears);
  const equityGain   = futureHomeVal - homePrice;
  const totalRentPaid = rentMonthly * 12 * holdYears;
  const totalMortgagePaid = monthlyPITI * 12 * holdYears;
  const realEstateCost = totalMortgagePaid - totalRentPaid; // opportunity cost vs renting

  // --- INVEST SCENARIO ---
  const investCapital = downPayment + (capital - downPayment > 0 ? capital - downPayment : 0);
  const futureInvestVal = capital * Math.pow(1 + investmentReturn / 100, holdYears);
  const investGain = futureInvestVal - capital;

  // Net comparison
  const realEstateNet = futureHomeVal - loanAmt - realEstateCost;
  const investNet     = futureInvestVal;

  return {
    realEstate: {
      futureValue: Math.round(futureHomeVal),
      equityGain: Math.round(equityGain),
      monthlyPayment: amort.monthlyPayment,
      totalInterest: amort.totalInterest,
      netPosition: Math.round(realEstateNet),
    },
    invest: {
      futureValue: Math.round(futureInvestVal),
      gain: Math.round(investGain),
      netPosition: Math.round(investNet),
    },
    winner: realEstateNet > investNet ? 'realestate' : 'invest',
    difference: Math.abs(Math.round(realEstateNet - investNet)),
  };
}

// Portfolio allocation advisor
export function getAllocationAdvice({ capital, riskTolerance, hasHome, timeHorizon }) {
  // Simple rule-based engine for MVP
  let rePercent  = 0;
  let mktPercent = 0;
  let bondPercent = 0;
  let cashPercent = 5;

  if (timeHorizon < 3) {
    cashPercent  = 30;
    bondPercent  = 40;
    mktPercent   = 25;
    rePercent    = 5;
  } else if (timeHorizon < 7) {
    if (riskTolerance === 'conservative') {
      bondPercent = 35; mktPercent = 40; rePercent = 20;
    } else if (riskTolerance === 'moderate') {
      bondPercent = 20; mktPercent = 55; rePercent = 20;
    } else {
      bondPercent = 10; mktPercent = 70; rePercent = 15;
    }
  } else {
    if (riskTolerance === 'conservative') {
      bondPercent = 25; mktPercent = 50; rePercent = 20;
    } else if (riskTolerance === 'moderate') {
      bondPercent = 10; mktPercent = 65; rePercent = 20;
    } else {
      bondPercent = 5;  mktPercent = 80; rePercent = 10;
    }
  }

  if (hasHome) {
    // Already have RE exposure — reduce RE allocation
    const shift = Math.round(rePercent * 0.5);
    rePercent  -= shift;
    mktPercent += shift;
  }

  // Normalize to 100
  const total = rePercent + mktPercent + bondPercent + cashPercent;
  const scale = 100 / total;
  rePercent   = Math.round(rePercent   * scale);
  mktPercent  = Math.round(mktPercent  * scale);
  bondPercent = Math.round(bondPercent * scale);
  cashPercent = 100 - rePercent - mktPercent - bondPercent;

  const projectedReturn =
    (rePercent  / 100) * 5.0 +
    (mktPercent / 100) * 10.5 +
    (bondPercent/ 100) * 2.0 +
    (cashPercent/ 100) * 5.0; // HYSA approx

  const futureValue = capital * Math.pow(1 + projectedReturn / 100, timeHorizon);

  return {
    allocations: {
      realEstate: rePercent,
      market: mktPercent,
      bonds: bondPercent,
      cash: cashPercent,
    },
    projectedAnnualReturn: Math.round(projectedReturn * 10) / 10,
    futureValue: Math.round(futureValue),
    gain: Math.round(futureValue - capital),
  };
}
