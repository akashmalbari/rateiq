import { useMemo, useState } from 'react';
import CalculatorLayout from '../../../components/calculator/CalculatorLayout';
import InputSection from '../../../components/calculator/InputSection';
import ResultSection from '../../../components/calculator/ResultSection';
import ComparisonChart from '../../../components/calculator/ComparisonChart';
import AffiliateSection from '../../../components/affiliate/AffiliateSection';
import { calculateMortgageVsInvest } from '../../../lib/calculations/housing';
import { getLiveRates } from '../../../lib/marketData';

export async function getServerSideProps() {
  const rates = await getLiveRates();
  return { props: { rates } };
}

export default function MortgageVsInvestPage({ rates }) {
  const [form, setForm] = useState({
    mortgageRate: rates.mortgage30,
    remainingLoanAmount: 320000,
    extraMonthlyPayment: 500,
    expectedInvestmentReturn: 8,
    termYears: 20,
  });
  const [result, setResult] = useState(() => calculateMortgageVsInvest(form));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onCalculate() {
    setResult(calculateMortgageVsInvest(form));
  }

  const chartData = useMemo(
    () => [{ name: 'Value', left: result.interestSaved, right: result.gainsFromInvesting }],
    [result],
  );

  return (
    <CalculatorLayout
      rates={rates}
      title="Mortgage vs Invest Extra Cash"
      description="See whether extra cash should prepay your mortgage or go into investments."
      seoTitle="Mortgage vs Invest Calculator 2026 | Finance Intelligence"
      seoDescription="Compare interest saved from mortgage prepayment vs projected investment gains with extra monthly cash."
      explanatoryText="Should you prepay your mortgage or invest extra monthly cash in 2026? This calculator estimates the tradeoff between interest savings and market growth under your assumptions."
    >
      <div className="grid md:grid-cols-2 gap-8">
        <InputSection onCalculate={onCalculate} buttonLabel="Compare Mortgage vs Invest">
          {[
            ['Mortgage rate', 'mortgageRate', '%'],
            ['Remaining loan amount', 'remainingLoanAmount', '$'],
            ['Extra monthly payment', 'extraMonthlyPayment', '$'],
            ['Expected investment return', 'expectedInvestmentReturn', '%'],
            ['Remaining term (years)', 'termYears', ''],
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
            summary="Interest savings and investment growth are based on constant-rate assumptions."
            accent={result.winner === 'invest' ? 'var(--green)' : 'var(--ink)'}
            metrics={[
              { label: 'Interest saved', value: result.interestSaved, positive: result.winner === 'mortgage' },
              { label: 'Investment gains', value: result.gainsFromInvesting, positive: result.winner === 'invest' },
            ]}
          />
          <ComparisonChart data={chartData} leftLabel="Mortgage Savings" rightLabel="Investment Gains" />
          <AffiliateSection
            category="housing"
            decisionType="mortgage-vs-invest"
            recommendation={result.recommendation}
            winner={result.winner}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
