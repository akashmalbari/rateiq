import { useMemo, useState } from 'react';
import CalculatorLayout from '../../../components/calculator/CalculatorLayout';
import InputSection from '../../../components/calculator/InputSection';
import ResultSection from '../../../components/calculator/ResultSection';
import ComparisonChart from '../../../components/calculator/ComparisonChart';
import AffiliateSection from '../../../components/affiliate/AffiliateSection';
import { calculateChildcareVsStayHome } from '../../../lib/calculations/lifestyle';

export default function ChildcareVsStayHomePage() {
  const [form, setForm] = useState({
    daycareCost: 1800,
    parentSalary: 90000,
    taxRate: 24,
    careerGrowthRate: 4,
    years: 5,
  });
  const [result, setResult] = useState(() => calculateChildcareVsStayHome(form));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const chartData = useMemo(
    () => [{ name: 'Net Impact', left: result.stayHomeNet, right: result.netWithDaycare }],
    [result],
  );

  return (
    <CalculatorLayout
      title="Childcare vs Stay-at-Home Calculator"
      description="Estimate net financial impact and opportunity cost over your planning horizon."
      seoTitle="Childcare vs Stay-at-Home Parent Calculator 2026 | Finance Intelligence"
      seoDescription="Compare daycare costs, after-tax salary, and career growth to evaluate childcare vs staying home."
      explanatoryText="Should one parent stay home or continue working with daycare in 2026? This tool estimates net income impact and the opportunity cost of stepping out of the workforce."
    >
      <div className="grid md:grid-cols-2 gap-8">
        <InputSection onCalculate={() => setResult(calculateChildcareVsStayHome(form))} buttonLabel="Compare Childcare vs Stay-at-Home">
          {[
            ['Daycare cost per month', 'daycareCost', '$'],
            ['Parent salary (annual)', 'parentSalary', '$'],
            ['Tax rate', 'taxRate', '%'],
            ['Career growth %', 'careerGrowthRate', '%'],
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
            summary="This view is purely financial and does not include non-financial family priorities."
            accent={result.winner === 'childcare' ? 'var(--green)' : 'var(--ink)'}
            metrics={[
              { label: 'Net with childcare', value: result.netWithDaycare, positive: result.winner === 'childcare' },
              { label: 'Stay-home net impact', value: result.stayHomeNet, positive: result.winner === 'stay-home' },
              { label: 'Opportunity cost', value: result.opportunityCost },
            ]}
          />
          <ComparisonChart data={chartData} leftLabel="Stay-at-Home" rightLabel="Childcare" />
          <AffiliateSection
            category="lifestyle"
            decisionType="childcare-vs-stay-home"
            recommendation={result.recommendation}
            winner={result.winner}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
