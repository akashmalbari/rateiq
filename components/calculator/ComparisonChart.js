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
    <div className="surface-card p-5 md:p-6 mt-4">
      <div className="eyebrow mb-3" style={{ color: 'var(--muted)' }}>
        Visual comparison
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(138, 171, 214, 0.18)" />
            <XAxis dataKey="name" tick={{ fill: '#93a8c7', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
              tick={{ fill: '#93a8c7', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => fmt(value)}
              contentStyle={{
                background: 'rgba(8, 17, 29, 0.95)',
                border: '1px solid rgba(138, 171, 214, 0.2)',
                borderRadius: 16,
                color: '#edf4ff',
              }}
            />
            <Legend wrapperStyle={{ color: '#93a8c7' }} />
            <Bar dataKey="left" name={leftLabel} fill="#58b7ff" radius={[8, 8, 0, 0]} />
            <Bar dataKey="right" name={rightLabel} fill="#58e0ac" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
