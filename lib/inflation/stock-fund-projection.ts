export interface StockFundProjectionInput {
  currentPrice: number;
  shares: number;
  /** Total price growth observed over the previous five years, in percent. */
  fiveYearGrowthPct: number;
  dividendYieldPct?: number;
  drip?: boolean;
  projectionYears: number;
}

export interface StockFundProjectionYear {
  year: number;
  actual: null;
  projected: number;
}

export function annualizedGrowthFromFiveYears(fiveYearGrowthPct: number) {
  if (!Number.isFinite(fiveYearGrowthPct) || fiveYearGrowthPct <= -100) return null;
  return (Math.pow(1 + fiveYearGrowthPct / 100, 1 / 5) - 1) * 100;
}

/**
 * Projects share price annually from a five-year growth observation. Dividends
 * are assumed paid once yearly at the entered yield; DRIP buys shares at that
 * year's projected price. Taxes, fees, and changes in dividend policy are excluded.
 */
export function projectStockFundValue(input: StockFundProjectionInput) {
  const dividendYieldPct = input.dividendYieldPct ?? 0;
  const annualGrowthRatePct = annualizedGrowthFromFiveYears(input.fiveYearGrowthPct);
  if (
    !Number.isFinite(input.currentPrice) ||
    !Number.isFinite(input.shares) ||
    !Number.isFinite(dividendYieldPct) ||
    !Number.isFinite(input.projectionYears) ||
    input.currentPrice < 0 ||
    input.shares < 0 ||
    dividendYieldPct < 0 ||
    input.projectionYears < 0 ||
    annualGrowthRatePct === null
  ) {
    return null;
  }

  const annualGrowthMultiplier = 1 + annualGrowthRatePct / 100;
  const dividendMultiplier = dividendYieldPct / 100;
  let price = input.currentPrice;
  let endingShares = input.shares;
  let cashDividends = 0;
  let reinvestedDividends = 0;
  const startingValue = input.currentPrice * input.shares;
  const timeline: StockFundProjectionYear[] = [{ year: 0, actual: null, projected: startingValue }];

  for (let year = 1; year <= input.projectionYears; year += 1) {
    price *= annualGrowthMultiplier;
    const dividend = endingShares * price * dividendMultiplier;
    if (input.drip) {
      endingShares += price > 0 ? dividend / price : 0;
      reinvestedDividends += dividend;
    } else {
      cashDividends += dividend;
    }
    timeline.push({
      year,
      actual: null,
      projected: price * endingShares + cashDividends
    });
  }

  const stockValue = price * endingShares;
  const finalValue = stockValue + cashDividends;
  // This is the next year's dividend capacity at the target-year price and share count.
  const projectedAnnualDividendIncome = stockValue * dividendMultiplier;
  return {
    startingValue,
    finalValue,
    stockValue,
    finalSharePrice: price,
    endingShares,
    cashDividends,
    reinvestedDividends,
    projectedAnnualDividendIncome,
    annualGrowthRatePct,
    totalReturnPct: startingValue > 0 ? ((finalValue / startingValue) - 1) * 100 : 0,
    timeline
  };
}
