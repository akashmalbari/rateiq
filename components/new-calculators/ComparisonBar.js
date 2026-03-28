function toPercent(value, max) {
  if (!max) {
    return 0;
  }

  return Math.min(100, Math.max(6, (value / max) * 100));
}

export default function ComparisonBar({ label, valueLabel, value, max, tone = 'var(--ink)' }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          {label}
        </div>
        <div className="text-sm font-bold">{valueLabel}</div>
      </div>
      <div
        className="h-3 rounded-sm overflow-hidden"
        style={{ background: 'rgba(10, 10, 10, 0.08)' }}
      >
        <div
          className="h-full rounded-sm"
          style={{ width: `${toPercent(value, max)}%`, background: tone, transition: 'width 0.35s ease' }}
        />
      </div>
    </div>
  );
}
