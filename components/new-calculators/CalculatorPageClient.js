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
    <>
      <CalculatorLayout
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        related={config.related}
        form={
          <div>
            <section
              className="rounded-sm p-6 md:p-8"
              style={{ background: 'white', border: '1px solid var(--border)' }}
            >
              <div className="flex items-baseline justify-between gap-4 mb-6">
                <h2 className="text-2xl font-display font-bold">Calculator Inputs</h2>
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
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
          <div
            className="rounded-sm p-5 md:p-6"
            style={{ background: 'var(--ink)', color: 'var(--paper)' }}
          >
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
              Your Snapshot
            </div>
            <h2 className="text-3xl font-display font-bold mb-3" style={{ lineHeight: 1.15 }}>
              {results.heroValue}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#bfb6a7', lineHeight: 1.7 }}>
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

            <div
              className="rounded-sm p-4 mb-6"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#d5c9b0' }}>
                Comparison View
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
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#d5c9b0' }}>
                Key Takeaway
              </div>
              <p className="text-sm" style={{ color: '#d9d2c7', lineHeight: 1.7 }}>
                {results.takeaway}
              </p>
            </div>

            <AffiliateCTA />
          </div>
        }
      />
    </>
  );
}
