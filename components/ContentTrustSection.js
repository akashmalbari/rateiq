export default function ContentTrustSection() {
  const points = [
    'Updated regularly',
    'Built for real-life decisions',
    'No fluff, data-driven insights',
  ];

  return (
    <section
      aria-label="Content trust signals"
      style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-5">Why people trust Figure My Money</h2>
        <ul className="grid md:grid-cols-3 gap-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {points.map((point) => (
            <li key={point} style={{ border: '1px solid var(--border)', borderRadius: '2px', padding: '16px 18px', background: 'var(--paper)' }}>
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
