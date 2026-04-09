export default function FAQSection({ faqs }) {
  return (
    <section className="mt-14">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />
      <div className="max-w-3xl mb-8">
        <div className="eyebrow mb-3">Questions you may still have</div>
        <h2 className="text-3xl md:text-4xl font-display font-semibold">Frequently asked questions</h2>
      </div>
      <div className="grid gap-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="surface-card p-5 md:p-6">
            <h3 className="text-lg md:text-xl font-display font-semibold mb-3">{faq.question}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
