export default function ContentTrustSection() {
  const points = [
    {
      title: 'Live-rate context',
      description: 'Mortgage, Fed, prime, and SOFR inputs help each comparison feel grounded in the current environment.',
    },
    {
      title: 'Decision-first design',
      description: 'Every tool is built around a real choice: rent or buy, invest or pay debt, lease or purchase, and more.',
    },
    {
      title: 'Transparent monetization',
      description: 'Affiliate options stay clearly labeled so the research remains useful even if you never click an offer.',
    },
  ];

  return (
    <section aria-label="Content trust signals" className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-8">
          <div className="eyebrow mb-3">Why people trust Figure My Money</div>
          <h2 className="text-3xl md:text-5xl font-display font-semibold mb-4" style={{ lineHeight: 1.05 }}>
            Built to answer the real question: what should I do with my money next?
          </h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
            The platform blends market context, calculator logic, and clear next-step framing so you can move faster without losing nuance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {points.map((point) => (
            <div key={point.title} className="surface-card p-6 md:p-7">
              <div className="eyebrow mb-3">Trust signal</div>
              <h3 className="text-2xl font-display font-semibold mb-3">{point.title}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
