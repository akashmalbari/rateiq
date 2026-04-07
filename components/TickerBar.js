// components/TickerBar.js
export default function TickerBar({ rates }) {
  const items = rates
    ? [
        { symbol: '30Y', label: '30yr', value: `${rates.mortgage30.toFixed(2)}%`, change: '-0.04%', up: false },
        { symbol: '15Y', label: '15yr', value: `${rates.mortgage15.toFixed(2)}%`, change: '-0.03%', up: false },
        { symbol: 'FED', label: 'Fed', value: `${rates.fedFunds.toFixed(2)}%`, change: '+0.00%', up: true },
        { symbol: 'PRM', label: 'Prime', value: `${rates.prime.toFixed(2)}%`, change: '+0.00%', up: true },
        { symbol: 'SFR', label: 'SOFR', value: `${rates.sofr.toFixed(2)}%`, change: '-0.01%', up: false },
        { symbol: 'SPX', label: 'S&P', value: '5,234', change: '+0.8%', up: true },
        { symbol: 'NDX', label: 'Nasdaq', value: '16,428', change: '+1.1%', up: true },
        { symbol: 'DOW', label: 'Dow', value: '39,127', change: '+0.5%', up: true },
      ]
    : [];

  const doubled = [...items, ...items];

  return (
    <div className="ticker-shell">
      <div className="ticker-inner" aria-label="Live market rates ticker">
        {doubled.map((item, i) => (
          <span key={`${item.symbol}-${i}`} className="ticker-item">
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-value">{item.value}</span>
            <span className={item.up ? 'ticker-change up' : 'ticker-change down'}>{item.change}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
