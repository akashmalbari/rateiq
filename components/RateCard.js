// components/RateCard.js
export default function RateCard({ label, value, sub, highlight }) {
  return (
    <div style={{
      background: highlight ? 'var(--ink)' : 'white',
      color: highlight ? 'var(--gold)' : 'var(--ink)',
      border: '1px solid var(--border)',
      padding: '20px 24px',
      borderRadius: '2px',
    }}>
      <div className="text-xs font-mono uppercase tracking-widest mb-1"
           style={{ color: highlight ? 'var(--gold-light)' : 'var(--muted)', opacity: 0.8 }}>
        {label}
      </div>
      <div className="text-3xl font-display font-bold">{value}</div>
      {sub && (
        <div className="text-xs mt-1 font-mono"
             style={{ color: highlight ? 'var(--gold-light)' : 'var(--muted)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
