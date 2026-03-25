// components/TickerBar.js
export default function TickerBar({ rates }) {
  const items = rates ? [
    { label: '30yr Fixed', value: `${rates.mortgage30.toFixed(2)}%`, up: false },
    { label: '15yr Fixed', value: `${rates.mortgage15.toFixed(2)}%`, up: false },
    { label: 'Fed Funds',  value: `${rates.fedFunds.toFixed(2)}%`,   up: false },
    { label: 'Prime Rate', value: `${rates.prime.toFixed(2)}%`,      up: false },
    { label: 'SOFR',       value: `${rates.sofr.toFixed(2)}%`,       up: false },
    { label: 'S&P 500',    value: '5,234',  up: true  },
    { label: 'NASDAQ',     value: '16,428', up: true  },
    { label: 'DOW',        value: '39,127', up: true  },
  ] : [];

  const doubled = [...items, ...items]; // seamless loop

  return (
    <div style={{ background: 'var(--ink)', color: 'var(--gold)', overflow: 'hidden' }}
         className="py-2 text-xs font-mono">
      <div className="ticker-inner">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 mx-6">
            <span style={{ color: 'var(--muted)' }}>{item.label}</span>
            <span className="font-bold">{item.value}</span>
            <span style={{ color: item.up ? '#4ade80' : '#f87171' }}>
              {item.up ? '▲' : '▼'}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
