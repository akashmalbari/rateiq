import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from 'recharts';

function fmt(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export default function ComparisonChart({ data = [], leftLabel = 'Option A', rightLabel = 'Option B' }) {
  if (!data.length) return null;

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px', marginTop: '16px' }}>
      <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
        Visual Comparison
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc6" />
            <XAxis dataKey="name" tick={{ fill: '#6b6560', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tick={{ fill: '#6b6560', fontSize: 12 }} />
            <Tooltip formatter={(value) => fmt(value)} />
            <Legend />
            <Bar dataKey="left" name={leftLabel} fill="#0a0a0a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="right" name={rightLabel} fill="#c9a84c" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
