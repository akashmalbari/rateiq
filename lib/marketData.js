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
  { city: 'Atlanta, GA',       region: 'South',     annualAppreciation: 5.2, medianHome: 405000, rentYield: 4.7 },
  { city: 'Austin, TX',        region: 'South',     annualAppreciation: 4.2, medianHome: 525000, rentYield: 3.8 },
  { city: 'Baltimore, MD',     region: 'Northeast', annualAppreciation: 3.9, medianHome: 355000, rentYield: 5.0 },
  { city: 'Boston, MA',        region: 'Northeast', annualAppreciation: 4.4, medianHome: 690000, rentYield: 3.4 },
  { city: 'Charlotte, NC',     region: 'South',     annualAppreciation: 5.5, medianHome: 370000, rentYield: 4.6 },
  { city: 'Chicago, IL',       region: 'Midwest',   annualAppreciation: 3.2, medianHome: 310000, rentYield: 5.6 },
  { city: 'Cleveland, OH',     region: 'Midwest',   annualAppreciation: 3.4, medianHome: 225000, rentYield: 6.1 },
  { city: 'Columbus, OH',      region: 'Midwest',   annualAppreciation: 4.0, medianHome: 270000, rentYield: 5.8 },
  { city: 'Dallas, TX',        region: 'South',     annualAppreciation: 4.6, medianHome: 380000, rentYield: 4.8 },
  { city: 'Denver, CO',        region: 'West',      annualAppreciation: 4.5, medianHome: 550000, rentYield: 3.6 },
  { city: 'Detroit, MI',       region: 'Midwest',   annualAppreciation: 3.6, medianHome: 215000, rentYield: 6.2 },
  { city: 'Houston, TX',       region: 'South',     annualAppreciation: 4.3, medianHome: 345000, rentYield: 5.0 },
  { city: 'Indianapolis, IN',  region: 'Midwest',   annualAppreciation: 4.1, medianHome: 285000, rentYield: 5.7 },
  { city: 'Kansas City, MO',   region: 'Midwest',   annualAppreciation: 4.0, medianHome: 295000, rentYield: 5.5 },
  { city: 'Las Vegas, NV',     region: 'West',      annualAppreciation: 5.0, medianHome: 445000, rentYield: 4.3 },
  { city: 'Miami, FL',         region: 'South',     annualAppreciation: 6.1, medianHome: 620000, rentYield: 4.1 },
  { city: 'Minneapolis, MN',   region: 'Midwest',   annualAppreciation: 3.5, medianHome: 340000, rentYield: 5.2 },
  { city: 'Nashville, TN',     region: 'South',     annualAppreciation: 5.3, medianHome: 430000, rentYield: 4.4 },
  { city: 'New York, NY',      region: 'Northeast', annualAppreciation: 3.7, medianHome: 780000, rentYield: 3.1 },
  { city: 'Orlando, FL',       region: 'South',     annualAppreciation: 5.1, medianHome: 390000, rentYield: 4.8 },
  { city: 'Philadelphia, PA',  region: 'Northeast', annualAppreciation: 3.8, medianHome: 310000, rentYield: 5.1 },
  { city: 'Phoenix, AZ',       region: 'West',      annualAppreciation: 4.8, medianHome: 410000, rentYield: 4.2 },
  { city: 'Pittsburgh, PA',    region: 'Northeast', annualAppreciation: 3.7, medianHome: 255000, rentYield: 5.6 },
  { city: 'Portland, OR',      region: 'West',      annualAppreciation: 4.1, medianHome: 515000, rentYield: 3.9 },
  { city: 'Salt Lake City, UT',region: 'West',      annualAppreciation: 4.9, medianHome: 545000, rentYield: 4.0 },
  { city: 'San Diego, CA',     region: 'West',      annualAppreciation: 4.3, medianHome: 905000, rentYield: 3.1 },
  { city: 'San Francisco, CA', region: 'West',      annualAppreciation: 3.9, medianHome: 1150000, rentYield: 2.8 },
  { city: 'Seattle, WA',       region: 'West',      annualAppreciation: 5.1, medianHome: 710000, rentYield: 3.3 },
  { city: 'Tampa, FL',         region: 'South',     annualAppreciation: 5.4, medianHome: 420000, rentYield: 4.7 },
  { city: 'Washington, DC',    region: 'Northeast', annualAppreciation: 4.0, medianHome: 675000, rentYield: 3.5 },
];

// Index funds — static for MVP, Phase 2 replaces with Alpha Vantage / Yahoo Finance
// Sorted alphabetically by ticker for visibility
export const INDEX_FUNDS = [
  {
    ticker: 'AGG',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    index: 'US Aggregate Bonds',
    expenseRatio: 0.03,
    historicReturn10yr: 1.7,
    historicReturn5yr: 0.4,
    historicReturn1yr: 4.1,
    risk: 'Low',
    description: 'Broad US investment-grade bond exposure across Treasuries, corporates, and MBS.',
  },
  {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market',
    index: 'US Bonds',
    expenseRatio: 0.03,
    historicReturn10yr: 1.6,
    historicReturn5yr: 0.2,
    historicReturn1yr: 4.7,
    risk: 'Low',
    description: 'Stability and income. Good ballast for your portfolio during market drops.',
  },
  {
    ticker: 'BNDX',
    name: 'Vanguard Total International Bond ETF',
    index: 'International Bonds',
    expenseRatio: 0.07,
    historicReturn10yr: 0.9,
    historicReturn5yr: -0.1,
    historicReturn1yr: 3.9,
    risk: 'Low',
    description: 'Hedged international bond exposure to diversify fixed income beyond US markets.',
  },
  {
    ticker: 'IWM',
    name: 'iShares Russell 2000 ETF',
    index: 'US Small Cap',
    expenseRatio: 0.19,
    historicReturn10yr: 8.4,
    historicReturn5yr: 10.6,
    historicReturn1yr: 16.8,
    risk: 'High',
    description: 'Tracks smaller US companies with higher growth potential and higher volatility.',
  },
  {
    ticker: 'QQQ',
    name: 'Invesco NASDAQ-100 ETF',
    index: 'NASDAQ-100',
    expenseRatio: 0.20,
    historicReturn10yr: 17.9,
    historicReturn5yr: 18.2,
    historicReturn1yr: 28.6,
    risk: 'Moderate-High',
    description: 'Top 100 non-financial NASDAQ companies. Tech-heavy, higher volatility.',
  },
  {
    ticker: 'RSP',
    name: 'Invesco S&P 500 Equal Weight ETF',
    index: 'S&P 500 Equal Weight',
    expenseRatio: 0.20,
    historicReturn10yr: 10.1,
    historicReturn5yr: 11.2,
    historicReturn1yr: 15.3,
    risk: 'Moderate',
    description: 'Equal-weights S&P 500 holdings, reducing concentration in mega-cap names.',
  },
  {
    ticker: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    index: 'US Dividend Equity',
    expenseRatio: 0.06,
    historicReturn10yr: 11.5,
    historicReturn5yr: 12.4,
    historicReturn1yr: 18.2,
    risk: 'Moderate',
    description: 'Quality US dividend strategy focused on cash flow and durable profitability.',
  },
  {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    index: 'S&P 500',
    expenseRatio: 0.09,
    historicReturn10yr: 12.6,
    historicReturn5yr: 14.3,
    historicReturn1yr: 23.9,
    risk: 'Moderate',
    description: 'Classic S&P 500 ETF with broad large-cap US exposure and deep liquidity.',
  },
  {
    ticker: 'TIP',
    name: 'iShares TIPS Bond ETF',
    index: 'US Inflation-Protected Bonds',
    expenseRatio: 0.19,
    historicReturn10yr: 2.1,
    historicReturn5yr: 2.4,
    historicReturn1yr: 3.8,
    risk: 'Low',
    description: 'US Treasury inflation-protected securities for inflation resilience in bond sleeves.',
  },
  {
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed Markets ETF',
    index: 'Developed International',
    expenseRatio: 0.06,
    historicReturn10yr: 5.8,
    historicReturn5yr: 8.1,
    historicReturn1yr: 13.2,
    risk: 'Moderate',
    description: 'Large and mid-cap companies across developed markets outside the US.',
  },
  {
    ticker: 'VGT',
    name: 'Vanguard Information Technology ETF',
    index: 'US Technology',
    expenseRatio: 0.10,
    historicReturn10yr: 19.4,
    historicReturn5yr: 21.1,
    historicReturn1yr: 31.8,
    risk: 'High',
    description: 'Concentrated US technology exposure. Higher growth potential with higher volatility.',
  },
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    index: 'REITs',
    expenseRatio: 0.12,
    historicReturn10yr: 8.1,
    historicReturn5yr: 4.3,
    historicReturn1yr: 7.9,
    risk: 'Moderate',
    description: 'Real estate exposure without buying property. Tracks commercial REITs.',
  },
  {
    ticker: 'VO',
    name: 'Vanguard Mid-Cap ETF',
    index: 'US Mid Cap',
    expenseRatio: 0.04,
    historicReturn10yr: 10.6,
    historicReturn5yr: 12.1,
    historicReturn1yr: 19.5,
    risk: 'Moderate',
    description: 'Diversified exposure to medium-sized US companies between large and small caps.',
  },
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    index: 'S&P 500',
    expenseRatio: 0.03,
    historicReturn10yr: 12.8,
    historicReturn5yr: 14.6,
    historicReturn1yr: 24.2,
    risk: 'Moderate',
    description: 'Tracks the 500 largest US companies. The gold standard of index investing.',
  },
  {
    ticker: 'VT',
    name: 'Vanguard Total World Stock ETF',
    index: 'Global Equities',
    expenseRatio: 0.07,
    historicReturn10yr: 9.1,
    historicReturn5yr: 10.8,
    historicReturn1yr: 18.7,
    risk: 'Moderate',
    description: 'Single-fund global equity exposure across both US and international stocks.',
  },
  {
    ticker: 'VTI',
    name: 'Vanguard Total Market ETF',
    index: 'US Total Market',
    expenseRatio: 0.03,
    historicReturn10yr: 12.2,
    historicReturn5yr: 13.9,
    historicReturn1yr: 23.5,
    risk: 'Moderate',
    description: 'Entire US stock market in one fund — 3,700+ companies.',
  },
  {
    ticker: 'VTV',
    name: 'Vanguard Value ETF',
    index: 'US Large Cap Value',
    expenseRatio: 0.04,
    historicReturn10yr: 9.8,
    historicReturn5yr: 10.2,
    historicReturn1yr: 17.1,
    risk: 'Moderate',
    description: 'Large-cap US value strategy focused on lower-valuation, cash-generative companies.',
  },
  {
    ticker: 'VUG',
    name: 'Vanguard Growth ETF',
    index: 'US Large Cap Growth',
    expenseRatio: 0.04,
    historicReturn10yr: 14.3,
    historicReturn5yr: 15.7,
    historicReturn1yr: 25.6,
    risk: 'Moderate-High',
    description: 'Large-cap US growth tilt, emphasizing faster earnings expansion and momentum.',
  },
  {
    ticker: 'VWO',
    name: 'Vanguard FTSE Emerging Markets ETF',
    index: 'Emerging Markets',
    expenseRatio: 0.08,
    historicReturn10yr: 3.9,
    historicReturn5yr: 5.6,
    historicReturn1yr: 9.8,
    risk: 'Moderate-High',
    description: 'Emerging market equities for higher long-run upside and diversification potential.',
  },
  {
    ticker: 'VXUS',
    name: 'Vanguard Total International',
    index: 'International',
    expenseRatio: 0.07,
    historicReturn10yr: 5.2,
    historicReturn5yr: 7.8,
    historicReturn1yr: 11.4,
    risk: 'Moderate',
    description: 'Diversification outside the US. Lower returns, lower correlation to US market.',
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
