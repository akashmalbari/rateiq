function fmt(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function ResultSection({ recommendation, summary, metrics = [], accent = 'var(--ink)' }) {
  return (
    <div>
      <div
        style={{
          background: accent,
          color: 'var(--paper)',
          padding: '24px',
          borderRadius: '2px',
          marginBottom: '16px',
        }}
      >
        <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>
          Recommendation
        </div>
        <div className="text-2xl md:text-3xl font-display font-bold mb-2" style={{ color: 'var(--gold)', lineHeight: 1.2 }}>
          {recommendation}
        </div>
        {summary ? <div style={{ color: 'rgba(245, 240, 232, 0.85)' }}>{summary}</div> : null}
      </div>

      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} style={{ background: 'white', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: '2px' }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                {metric.label}
              </div>
              <div className="font-bold font-display text-xl" style={{ color: metric.positive ? 'var(--green)' : 'var(--ink)' }}>
                {metric.type === 'percent' ? `${Number(metric.value || 0).toFixed(2)}%` : metric.type === 'number' ? Number(metric.value || 0).toLocaleString() : fmt(metric.value)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
