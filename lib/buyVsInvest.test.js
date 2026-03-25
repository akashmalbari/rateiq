const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateBuyVsInvest } = require('./buyVsInvest.js');

test('includes property appreciation in the buy-side ending value', () => {
  const withoutAppreciation = calculateBuyVsInvest({
    homePrice: 400000,
    downPayment: 80000,
    interestRate: 6,
    loanTermYears: 30,
    expectedReturnRate: 8,
    yearsHeld: 10,
    propertyAppreciationRate: 0,
  });

  const withAppreciation = calculateBuyVsInvest({
    homePrice: 400000,
    downPayment: 80000,
    interestRate: 6,
    loanTermYears: 30,
    expectedReturnRate: 8,
    yearsHeld: 10,
    propertyAppreciationRate: 5,
  });

  assert.equal(withoutAppreciation.appreciatedHomeValue, 400000);
  assert(withAppreciation.appreciatedHomeValue > withoutAppreciation.appreciatedHomeValue);
  assert(withAppreciation.homeEquityAfterYearsHeld > withoutAppreciation.homeEquityAfterYearsHeld);
});

test('falls back to 0% appreciation when market data is missing', () => {
  const result = calculateBuyVsInvest({
    homePrice: 350000,
    downPayment: 70000,
    interestRate: 6,
    loanTermYears: 30,
    expectedReturnRate: 8,
    yearsHeld: 7,
  });

  assert.equal(result.propertyAppreciationRateUsed, 0);
  assert.equal(result.appreciatedHomeValue, 350000);
});
