function fmt(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function ResultSection({ recommendation, summary, metrics = [], accent = 'var(--gold)' }) {
  return (
    <div>
      <div className="surface-panel p-6 md:p-7 mb-4">
        <div className="eyebrow mb-3">Recommendation</div>
        <div className="text-2xl md:text-3xl font-display font-semibold mb-2" style={{ color: accent, lineHeight: 1.2 }}>
          {recommendation}
        </div>
        {summary ? <div style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{summary}</div> : null}
      </div>

      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="surface-card p-4 md:p-5">
              <div className="eyebrow mb-2" style={{ color: 'var(--muted)' }}>
                {metric.label}
              </div>
              <div className="font-display font-semibold text-xl" style={{ color: metric.positive ? 'var(--green)' : 'var(--ink)' }}>
                {metric.type === 'percent'
                  ? `${Number(metric.value || 0).toFixed(2)}%`
                  : metric.type === 'number'
                  ? Number(metric.value || 0).toLocaleString()
                  : fmt(metric.value)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
