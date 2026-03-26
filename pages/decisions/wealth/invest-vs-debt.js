import { useMemo, useState } from 'react';
import CalculatorLayout from '../../../components/calculator/CalculatorLayout';
import InputSection from '../../../components/calculator/InputSection';
import ResultSection from '../../../components/calculator/ResultSection';
import ComparisonChart from '../../../components/calculator/ComparisonChart';
import AffiliateSection from '../../../components/affiliate/AffiliateSection';
import { calculateInvestVsDebt } from '../../../lib/calculations/wealth';

export default function InvestVsDebtPage() {
  const [form, setForm] = useState({
    debtInterestRate: 9,
    investmentReturn: 8,
    extraMonthlyCash: 600,
    years: 10,
  });
  const [result, setResult] = useState(() => calculateInvestVsDebt(form));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const chartData = useMemo(
    () => [{ name: 'Projected Benefit', left: result.debtSavings, right: result.investmentGain }],
    [result],
  );

  return (
    <CalculatorLayout
      title="Invest vs Pay Off Debt Calculator"
      description="Compare the benefit of debt payoff versus investing your extra monthly cash."
      seoTitle="Invest vs Debt Calculator 2026 | Finance Intelligence"
      seoDescription="Compare debt interest savings versus potential investment gains with extra monthly cash."
      explanatoryText="Should you invest extra cash or pay down debt in 2026? This calculator compares projected investment gains against estimated debt-interest savings over time."
    >
      <div className="grid md:grid-cols-2 gap-8">
        <InputSection onCalculate={() => setResult(calculateInvestVsDebt(form))} buttonLabel="Compare Invest vs Debt">
          {[
            ['Debt interest rate', 'debtInterestRate', '%'],
            ['Investment return', 'investmentReturn', '%'],
            ['Extra monthly cash', 'extraMonthlyCash', '$'],
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
            summary="Assumes consistent rates and steady monthly contributions."
            accent={result.winner === 'invest' ? 'var(--green)' : 'var(--ink)'}
            metrics={[
              { label: 'Debt savings', value: result.debtSavings, positive: result.winner === 'debt' },
              { label: 'Investment gain', value: result.investmentGain, positive: result.winner === 'invest' },
              { label: 'Net gain/loss', value: result.netGain, positive: result.netGain >= 0 },
            ]}
          />
          <ComparisonChart data={chartData} leftLabel="Debt Savings" rightLabel="Invest Gain" />
          <AffiliateSection
            category="wealth"
            decisionType="invest-vs-debt"
            recommendation={result.recommendation}
            winner={result.winner}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
