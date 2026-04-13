import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

function RateCard({ label, value, unit = "%", desc, change }) {
  return (
    <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
      <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <span className="font-mono font-bold text-3xl text-slate-100">{value}</span>
        <span className="text-slate-400 text-lg mb-0.5">{unit}</span>
      </div>
      {desc && <p className="text-xs text-slate-600 mt-2">{desc}</p>}
    </div>
  );
}

function StockCard({ label, symbol, data }) {
  if (!data) return null;
  const pos = data.dp >= 0;
  return (
    <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{symbol}</p>
          <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${pos ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {pos ? "+" : ""}{data.dp?.toFixed(2)}%
        </div>
      </div>
      <p className="font-mono font-bold text-3xl text-slate-100 mb-3">${data.c?.toFixed(2)}</p>
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div><p className="text-slate-600">Open</p><p className="text-slate-400">${data.o?.toFixed(2)}</p></div>
        <div><p className="text-slate-600">High</p><p className="text-emerald-400">${data.h?.toFixed(2)}</p></div>
        <div><p className="text-slate-600">Low</p><p className="text-rose-400">${data.l?.toFixed(2)}</p></div>
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const { data: d } = await axios.get(`${API}/market/rates`);
      setData(d);
      setLastUpdate(new Date());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    document.title = "Live Market Rates | FigureMyMoney";
    fetchData();
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-[#0B0E14] min-h-screen">
      {/* Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium font-mono">Live Data</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-4" data-testid="markets-title">
                Live Market Rates
              </h1>
              <p className="text-lg text-slate-400 max-w-xl">
                Real-time mortgage rates from the Federal Reserve (FRED) and stock market data from Finnhub.
              </p>
            </div>
            {lastUpdate && (
              <button onClick={fetchData}
                className="flex items-center gap-2 bg-white/5 border border-white/10 text-slate-400 text-sm rounded-xl px-4 py-2.5 hover:bg-white/10 transition-colors"
                data-testid="refresh-btn">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh · {lastUpdate.toLocaleTimeString()}
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Fetching live data...</p>
          </div>
        ) : (
          <>
            {/* Interest Rates */}
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Activity className="w-5 h-5 text-amber-500" />
                <h2 className="font-heading text-2xl font-bold text-slate-100">Interest Rates</h2>
                <span className="text-xs text-slate-600 font-mono">Source: FRED (Federal Reserve)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="rates-grid">
                <RateCard label="30yr Fixed Mortgage" value={data?.rates.mortgage_30y?.toFixed(2)} desc="National average, weekly" />
                <RateCard label="15yr Fixed Mortgage" value={data?.rates.mortgage_15y?.toFixed(2)} desc="National average, weekly" />
                <RateCard label="Fed Funds Rate" value={data?.rates.fed_funds?.toFixed(2)} desc="Federal Reserve target rate" />
                <RateCard label="Prime Rate" value={data?.rates.prime?.toFixed(2)} desc="Bank prime lending rate" />
                <RateCard label="SOFR" value={data?.rates.sofr?.toFixed(2)} desc="Secured overnight financing" />
              </div>
            </section>

            {/* Stock ETFs */}
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h2 className="font-heading text-2xl font-bold text-slate-100">Market ETFs</h2>
                <span className="text-xs text-slate-600 font-mono">Source: Finnhub</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" data-testid="stocks-grid">
                <StockCard label="S&P 500 ETF" symbol="SPY" data={data?.stocks.spy} />
                <StockCard label="NASDAQ 100 ETF" symbol="QQQ" data={data?.stocks.qqq} />
                <StockCard label="Dow Jones ETF" symbol="DIA" data={data?.stocks.dia} />
              </div>
            </section>

            {/* Context */}
            <section>
              <div className="bg-[#151A22]/50 border border-white/5 rounded-2xl p-8">
                <h3 className="font-heading font-semibold text-xl text-slate-200 mb-4">Understanding These Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-400 leading-relaxed">
                  <div>
                    <h4 className="text-slate-300 font-medium mb-2">Mortgage Rates & the 10-Year Treasury</h4>
                    <p>30-year fixed mortgage rates closely track the 10-year Treasury yield, with a typical spread of 1.5–2.5%. When Treasury yields rise (due to Fed policy, inflation expectations, or bond market dynamics), mortgage rates follow.</p>
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium mb-2">Fed Funds vs Prime Rate</h4>
                    <p>The Fed Funds rate is the overnight lending rate between banks. The Prime Rate is set by commercial banks at approximately Fed Funds + 3%. SOFR (Secured Overnight Financing Rate) is the benchmark replacing LIBOR for adjustable-rate loans.</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-mono mt-6">
                  Rates updated every 3 hours from FRED (Federal Reserve Bank of St. Louis). ETF data refreshed every 5 minutes from Finnhub.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
