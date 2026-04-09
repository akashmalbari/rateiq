export default function ExplanationSection({ intro, sections }) {
  return (
    <section className="mt-14">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />
      <div className="max-w-3xl mb-8">
        <div className="eyebrow mb-3">Interpret the output</div>
        <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">How to use these results</h2>
        <p className="text-base" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
          {intro}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.heading} className="surface-card p-6 md:p-7">
            <div className="eyebrow mb-3">Insight</div>
            <h3 className="text-xl md:text-2xl font-display font-semibold mb-3">{section.heading}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
