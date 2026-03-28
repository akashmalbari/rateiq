export default function FAQSection({ faqs }) {
  return (
    <section className="mt-14">
      <div className="rule-thick mb-1" />
      <div className="rule-thin mb-8" />
      <h2 className="text-3xl font-display font-bold mb-8">Frequently Asked Questions</h2>
      <div className="grid gap-4">
        {faqs.map((faq) => (
          <article
            key={faq.question}
            className="rounded-sm p-5"
            style={{ background: 'white', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-display font-bold mb-2">{faq.question}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
