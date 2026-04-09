'use client';

import { useState } from 'react';
import CalculatorLayout from './CalculatorLayout';
import InputField from './InputField';
import ResultCard from './ResultCard';
import ExplanationSection from './ExplanationSection';
import FAQSection from './FAQSection';
import AffiliateCTA from './AffiliateCTA';
import ComparisonBar from './ComparisonBar';
import RelatedCalculators from './RelatedCalculators';
import ComparisonChart from '../calculator/ComparisonChart';
import { getCalculatorConfig } from '../../data/calculators';

function buildInitialValues(config) {
  return config.inputs.reduce((accumulator, field) => {
    accumulator[field.id] = field.defaultValue;
    return accumulator;
  }, {});
}

export default function CalculatorPageClient({ slug }) {
  const config = getCalculatorConfig(slug);
  const [values, setValues] = useState(() => buildInitialValues(config));
  const results = config.calculate(values);

  const handleChange = (fieldId, nextValue) => {
    setValues((current) => ({
      ...current,
      [fieldId]: nextValue,
    }));
  };

  return (
    <CalculatorLayout
      eyebrow={config.eyebrow}
      title={config.title}
      description={config.description}
      related={config.related}
      form={
        <div>
          <section className="surface-card p-6 md:p-8">
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h2 className="text-2xl font-display font-semibold">Calculator inputs</h2>
              <div className="eyebrow" style={{ color: 'var(--muted)' }}>
                Updates instantly
              </div>
            </div>
            <div className="grid gap-x-5 md:grid-cols-2">
              {config.inputs.map((field) => (
                <InputField
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </section>

          <ExplanationSection intro={config.explanationIntro} sections={config.explanationSections} />
          <FAQSection faqs={config.faqs} />
          <RelatedCalculators slugs={config.related} />
        </div>
      }
      results={
        <div className="surface-panel p-5 md:p-6">
          <div className="eyebrow mb-3">Your snapshot</div>
          <h2 className="text-3xl font-display font-semibold mb-3" style={{ lineHeight: 1.1 }}>
            {results.heroValue}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
            {results.heroText}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {results.cards.map((card) => (
              <ResultCard
                key={card.label}
                label={card.label}
                value={card.value}
                accent={card.accent}
                note={card.note}
              />
            ))}
          </div>

          <div className="surface-muted p-4 mb-6">
            <div className="eyebrow mb-4" style={{ color: 'var(--muted)' }}>
              Comparison view
            </div>
            {results.comparisons.map((comparison) => (
              <ComparisonBar
                key={comparison.label}
                label={comparison.label}
                valueLabel={comparison.valueLabel}
                value={comparison.value}
                max={comparison.max}
                tone={comparison.tone}
              />
            ))}
          </div>

          {results.chartData ? (
            <div className="mb-6">
              <ComparisonChart
                data={results.chartData}
                leftLabel={results.chartLabels?.leftLabel}
                rightLabel={results.chartLabels?.rightLabel}
              />
            </div>
          ) : null}

          <div className="mb-6">
            <div className="eyebrow mb-2" style={{ color: 'var(--muted)' }}>
              Key takeaway
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
              {results.takeaway}
            </p>
          </div>

          <AffiliateCTA />
        </div>
      }
    />
  );
}
