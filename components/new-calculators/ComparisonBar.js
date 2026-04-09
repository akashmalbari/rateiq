function toPercent(value, max) {
  if (!max) {
    return 0;
  }

  return Math.min(100, Math.max(6, (value / max) * 100));
}

export default function ComparisonBar({ label, valueLabel, value, max, tone = 'var(--gold)' }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="eyebrow" style={{ color: 'var(--muted)' }}>
          {label}
        </div>
        <div className="text-sm font-semibold">{valueLabel}</div>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ background: 'rgba(138, 171, 214, 0.16)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${toPercent(value, max)}%`, background: tone, transition: 'width 0.35s ease' }}
        />
      </div>
    </div>
  );
}
