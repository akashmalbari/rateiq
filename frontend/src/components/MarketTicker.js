import { useState, useEffect } from "react";
import Marquee from "react-fast-marquee";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const FALLBACK_ITEMS = [
  { label: "30yr Fixed", value: "6.87%", type: "rate" },
  { label: "15yr Fixed", value: "6.15%", type: "rate" },
  { label: "Fed Funds", value: "5.33%", type: "rate" },
  { label: "Prime Rate", value: "8.50%", type: "rate" },
  { label: "SOFR", value: "5.30%", type: "rate" },
  { label: "S&P 500 ETF", value: "$521.45", change: "+0.45%", type: "stock", positive: true },
  { label: "NASDAQ ETF", value: "$441.23", change: "+0.62%", type: "stock", positive: true },
  { label: "DOW ETF", value: "$392.12", change: "+0.31%", type: "stock", positive: true },
];

function TickerItem({ item }) {
  return (
    <div className="flex items-center gap-2 mx-6 whitespace-nowrap">
      <span className="text-slate-500 text-xs font-mono">{item.label}</span>
      <span className="text-slate-200 text-xs font-mono font-medium">{item.value}</span>
      {item.change && (
        <span className={`text-xs font-mono font-medium ${item.positive ? "text-emerald-400" : "text-rose-400"}`}>
          {item.change}
        </span>
      )}
      <span className="text-white/10 ml-4">|</span>
    </div>
  );
}

export default function MarketTicker() {
  const [items, setItems] = useState(FALLBACK_ITEMS);

  const fetchTicker = async () => {
    try {
      const { data } = await axios.get(`${API}/market/ticker`);
      if (data.items?.length) setItems(data.items);
    } catch {}
  };

  useEffect(() => {
    fetchTicker();
    const id = setInterval(fetchTicker, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div data-testid="market-ticker" className="bg-[#080B10] border-b border-white/5 py-1.5 overflow-hidden">
      <Marquee speed={35} gradient={false} pauseOnHover={true}>
        <div className="flex items-center">
          {[...items, ...items].map((item, i) => (
            <TickerItem key={i} item={item} />
          ))}
        </div>
      </Marquee>
    </div>
  );
}
