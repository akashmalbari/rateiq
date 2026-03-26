import { useMemo, useState } from 'react';
import CalculatorLayout from '../../../components/calculator/CalculatorLayout';
import InputSection from '../../../components/calculator/InputSection';
import ResultSection from '../../../components/calculator/ResultSection';
import ComparisonChart from '../../../components/calculator/ComparisonChart';
import AffiliateSection from '../../../components/affiliate/AffiliateSection';
import { calculateLumpSumVsDca } from '../../../lib/calculations/wealth';

export default function LumpSumVsDcaPage() {
  const [form, setForm] = useState({
    investmentAmount: 120000,
    frequencyPerYear: 12,
    annualReturn: 8,
    years: 10,
    riskPenaltyPercent: 1.5,
  });
  const [result, setResult] = useState(() => calculateLumpSumVsDca(form));

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const chartData = useMemo(
    () => [{ name: 'Final Value', left: result.lumpSumValue, right: result.dcaValue }],
    [result],
  );

  return (
    <CalculatorLayout
      title="Lump Sum vs SIP (DCA) Calculator"
      description="Compare final portfolio value and risk-adjusted outcomes for lump sum versus DCA."
      seoTitle="Lump Sum vs SIP DCA Calculator 2026 | Finance Intelligence"
      seoDescription="Compare lump sum investing vs SIP/DCA with market return assumptions and risk-adjusted view."
      explanatoryText="Should you invest a lump sum or spread it with SIP/DCA in 2026? This calculator compares final value and a simple risk-adjusted comparison using your assumptions."
    >
      <div className="grid md:grid-cols-2 gap-8">
        <InputSection onCalculate={() => setResult(calculateLumpSumVsDca(form))} buttonLabel="Compare Lump Sum vs SIP">
          {[
            ['Investment amount', 'investmentAmount', '$'],
            ['SIP frequency / year', 'frequencyPerYear', ''],
            ['Annual return', 'annualReturn', '%'],
            ['Years', 'years', ''],
            ['Risk penalty % (lump sum)', 'riskPenaltyPercent', '%'],
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
            summary="Risk-adjusted view applies a configurable penalty to lump sum concentration risk."
            accent={result.winner === 'dca' ? 'var(--green)' : 'var(--ink)'}
            metrics={[
              { label: 'Lump sum final value', value: result.lumpSumValue, positive: result.winner === 'lump-sum' },
              { label: 'SIP/DCA final value', value: result.dcaValue, positive: result.winner === 'dca' },
              { label: 'Lump sum risk-adjusted', value: result.lumpRiskAdjusted },
              { label: 'DCA risk-adjusted', value: result.dcaRiskAdjusted },
            ]}
          />
          <ComparisonChart data={chartData} leftLabel="Lump Sum" rightLabel="SIP / DCA" />
          <AffiliateSection
            category="wealth"
            decisionType="lump-sum-vs-dca"
            recommendation={result.recommendation}
            winner={result.winner}
          />
        </div>
      </div>
    </CalculatorLayout>
  );
}
