import { useMemo, useState } from 'react';
import CalculatorLayout from '../../../components/calculator/CalculatorLayout';
import InputSection from '../../../components/calculator/InputSection';
import ResultSection from '../../../components/calculator/ResultSection';
import ComparisonChart from '../../../components/calculator/ComparisonChart';
import AffiliateSection from '../../../components/affiliate/AffiliateSection';
import { calculateRetirementProjection } from '../../../lib/calculations/wealth';

export default function RetirementProjectionPage() {
  const [form, setForm] = useState({
    currentSavings: 120000,
    monthlyContribution: 1200,
    expectedReturn: 7,
    currentAge: 35,
    retirementAge: 65,
  });
  const [result, setResult] = useState(() => calculateRetirementProjection(form));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const chartData = useMemo(
    () => [{ name: 'Retirement Assets', left: form.currentSavings, right: result.futureValue }],
    [form.currentSavings, result.futureValue],
  );

  return (
    <CalculatorLayout
      title="Retirement Projection Calculator"
      description="Project your future retirement assets and estimated monthly income."
      seoTitle="Retirement Projection Calculator 2026 | Finance Intelligence"
      seoDescription="Estimate future retirement value and monthly retirement income based on savings and contributions."
      explanatoryText="How much could you have by retirement in 2026 planning terms? This calculator projects your portfolio value and a simplified monthly income estimate using a 4% annual draw rule."
    >
      <div className="grid md:grid-cols-2 gap-8">
        <InputSection onCalculate={() => setResult(calculateRetirementProjection(form))} buttonLabel="Project Retirement">
          {[
            ['Current savings', 'currentSavings', '$'],
            ['Monthly contribution', 'monthlyContribution', '$'],
            ['Expected return', 'expectedReturn', '%'],
            ['Current age', 'currentAge', ''],
            ['Retirement age', 'retirementAge', ''],
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
            recommendation="Stay consistent with contributions and review assumptions yearly."
            summary={`Years to retirement: ${result.yearsToRetirement}`}
            accent="var(--ink)"
            metrics={[
              { label: 'Future value', value: result.futureValue, positive: true },
              { label: 'Monthly income estimate', value: result.monthlyIncomeEstimate, positive: true },
              { label: 'Years to retirement', value: result.yearsToRetirement, type: 'number' },
            ]}
          />
          <ComparisonChart data={chartData} leftLabel="Current" rightLabel="Projected" />
          <AffiliateSection
            category="wealth"
            decisionType="retirement"
            recommendation="Open a retirement account with low fees and automated contributions."
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
