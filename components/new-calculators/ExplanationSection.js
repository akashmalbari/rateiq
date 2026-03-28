export default function ExplanationSection({ intro, sections }) {
  return (
    <section className="mt-14">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />
      <h2 className="text-3xl font-display font-bold mb-4">How To Use These Results</h2>
      <p className="max-w-3xl mb-8 text-base" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
        {intro}
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.heading}
            className="rounded-sm p-6"
            style={{ background: 'white', border: '1px solid var(--border)' }}
          >
            <h3 className="text-xl font-display font-bold mb-3">{section.heading}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
