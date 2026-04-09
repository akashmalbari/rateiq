export default function ResultCard({ label, value, accent, note }) {
  return (
    <div className="surface-muted p-4 md:p-5">
      <div className="eyebrow mb-2" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="text-2xl font-display font-semibold" style={{ color: accent || 'var(--ink)' }}>
        {value}
      </div>
      {note ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
