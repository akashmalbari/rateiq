import { useMemo, useState } from 'react';
import CalculatorLayout from '../../../components/calculator/CalculatorLayout';
import InputSection from '../../../components/calculator/InputSection';
import ResultSection from '../../../components/calculator/ResultSection';
import ComparisonChart from '../../../components/calculator/ComparisonChart';
import AffiliateSection from '../../../components/affiliate/AffiliateSection';
import { calculateRentVsBuy } from '../../../lib/calculations/housing';
import { getLiveRates } from '../../../lib/marketData';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

export default function RentVsBuyPage({ rates }) {
  const [form, setForm] = useState({
    rentPerMonth: 2200,
    homePrice: 450000,
    downPayment: 90000,
    interestRate: rates.mortgage30,
    propertyTaxRate: 1.2,
    maintenanceRate: 1,
    annualRentIncrease: 3,
    homeAppreciationRate: 4,
    investmentReturnRate: 8,
    years: 10,
  });
  const [result, setResult] = useState(() => calculateRentVsBuy(form));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onCalculate() {
    setResult(calculateRentVsBuy(form));
  }

  const chartData = useMemo(
    () => [
      { name: 'Net Worth', left: result.rentNetWorth, right: result.buyNetWorth },
      { name: 'Core Cost', left: result.totalRentPaid, right: result.totalInterest },
    ],
    [result],
  );

  return (
    <CalculatorLayout
      rates={rates}
      title="Rent vs Buy Calculator"
      description="Estimate whether renting or buying builds more wealth over your timeline."
      seoTitle="Rent vs Buy Calculator 2026 | Finance Intelligence"
      seoDescription="Is it better to rent or buy a house in 2026? Compare net worth, break-even year, and recommendation."
      explanatoryText="Is it better to rent or buy a house in 2026? This calculator compares projected net worth under both paths, including mortgage costs, appreciation, taxes, maintenance, rent inflation, and market returns."
    >
      <div className="grid md:grid-cols-2 gap-8">
        <InputSection onCalculate={onCalculate} buttonLabel="Compare Rent vs Buy">
          {[
            ['Rent per month', 'rentPerMonth', '$'],
            ['Home price', 'homePrice', '$'],
            ['Down payment', 'downPayment', '$'],
            ['Interest rate', 'interestRate', '%'],
            ['Property tax', 'propertyTaxRate', '%'],
            ['Maintenance %', 'maintenanceRate', '%'],
            ['Annual rent increase', 'annualRentIncrease', '%'],
            ['Home appreciation %', 'homeAppreciationRate', '%'],
            ['Investment return %', 'investmentReturnRate', '%'],
            ['Years', 'years', ''],
          ].map(([label, key, suffix]) => (
            <div key={key} className="mb-4">
              <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                {suffix === '$' ? <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span> : null}
                <input
                  type="number"
                  step="0.01"
                  value={form[key]}
                  onChange={(e) => update(key, Number(e.target.value))}
                  style={{ paddingLeft: suffix === '$' ? 24 : 14, paddingRight: suffix === '%' ? 24 : 14 }}
                />
                {suffix === '%' ? <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>%</span> : null}
              </div>
            </div>
          ))}
        </InputSection>

        <div>
          <ResultSection
            recommendation={result.recommendation}
            summary={`Break-even year: ${result.breakEvenYear || 'Not reached in selected horizon'}`}
            accent={result.winner === 'rent' ? 'var(--green)' : 'var(--ink)'}
            metrics={[
              { label: 'Rent net worth', value: result.rentNetWorth, positive: result.winner === 'rent' },
              { label: 'Buy net worth', value: result.buyNetWorth, positive: result.winner === 'buy' },
              { label: 'Net difference', value: result.difference },
              { label: 'Break-even year', value: result.breakEvenYear || 0, type: 'number' },
            ]}
          />
          <ComparisonChart data={chartData} leftLabel="Rent" rightLabel="Buy" />
          <AffiliateSection
            category="housing"
            decisionType="rent-vs-buy"
            recommendation={result.recommendation}
            winner={result.winner}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
