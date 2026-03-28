export default function ResultCard({ label, value, accent, note }) {
  return (
    <div
      className="rounded-sm p-4"
      style={{ background: 'white', border: '1px solid var(--border)' }}
    >
      <div
        className="text-xs font-mono uppercase tracking-widest mb-1"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-display font-bold"
        style={{ color: accent || 'var(--ink)' }}
      >
        {value}
      </div>
      {note ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
