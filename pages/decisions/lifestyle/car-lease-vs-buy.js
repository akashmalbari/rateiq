import { useMemo, useState } from 'react';
import CalculatorLayout from '../../../components/calculator/CalculatorLayout';
import InputSection from '../../../components/calculator/InputSection';
import ResultSection from '../../../components/calculator/ResultSection';
import ComparisonChart from '../../../components/calculator/ComparisonChart';
import AffiliateSection from '../../../components/affiliate/AffiliateSection';
import { calculateCarLeaseVsBuy } from '../../../lib/calculations/lifestyle';

export default function CarLeaseVsBuyPage() {
  const [form, setForm] = useState({
    carPrice: 42000,
    leaseMonthlyPayment: 540,
    leaseTermMonths: 36,
    loanInterestRate: 6.5,
    annualMaintenance: 1200,
    depreciationRate: 12,
    years: 6,
  });
  const [result, setResult] = useState(() => calculateCarLeaseVsBuy(form));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const chartData = useMemo(
    () => [{ name: 'Total Cost', left: result.totalLeaseCost, right: result.totalBuyCost }],
    [result],
  );

  return (
    <CalculatorLayout
      title="Car Lease vs Buy Calculator"
      description="Compare total cost of leasing versus buying over your ownership horizon."
      seoTitle="Car Lease vs Buy Calculator 2026 | Finance Intelligence"
      seoDescription="Compare lease and buy costs, ownership value, and clear recommendation for your car decision."
      explanatoryText="Should you lease or buy a car in 2026? This calculator estimates total cash cost and residual ownership value so you can make a financially grounded choice."
    >
      <div className="grid md:grid-cols-2 gap-8">
        <InputSection onCalculate={() => setResult(calculateCarLeaseVsBuy(form))} buttonLabel="Compare Lease vs Buy">
          {[
            ['Car price', 'carPrice', '$'],
            ['Lease monthly payment', 'leaseMonthlyPayment', '$'],
            ['Lease term (months)', 'leaseTermMonths', ''],
            ['Loan interest rate', 'loanInterestRate', '%'],
            ['Annual maintenance', 'annualMaintenance', '$'],
            ['Depreciation rate', 'depreciationRate', '%'],
            ['Years', 'years', ''],
          ].map(([label, key, suffix]) => (
            <div key={key} className="mb-4">
              <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                {suffix === '$' ? <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span> : null}
                <input type="number" step="0.01" value={form[key]} onChange={(e) => update(key, Number(e.target.value))} style={{ paddingLeft: suffix === '$' ? 24 : 14, paddingRight: suffix === '%' ? 24 : 14 }} />
                {suffix === '%' ? <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>%</span> : null}
              </div>
            </div>
          ))}
        </InputSection>

        <div>
          <ResultSection
            recommendation={result.recommendation}
            summary="Includes financing, maintenance, and ownership value at end of horizon."
            accent={result.winner === 'buy' ? 'var(--ink)' : 'var(--green)'}
            metrics={[
              { label: 'Total buy cost', value: result.totalBuyCost, positive: result.winner === 'buy' },
              { label: 'Total lease cost', value: result.totalLeaseCost, positive: result.winner === 'lease' },
              { label: 'Ownership value', value: result.ownershipValue, positive: true },
            ]}
          />
          <ComparisonChart data={chartData} leftLabel="Lease" rightLabel="Buy" />
          <AffiliateSection
            category="lifestyle"
            decisionType="car-lease-vs-buy"
            recommendation={result.recommendation}
            winner={result.winner}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
