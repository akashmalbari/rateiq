import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Activity, RefreshCw, Home, Building2 } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const ETF_META = {
  SPY: { label: "S&P 500 ETF", category: "Equity" },
  QQQ: { label: "NASDAQ 100 ETF", category: "Equity" },
  DIA: { label: "Dow Jones ETF", category: "Equity" },
  VNQ: { label: "Real Estate ETF", category: "Real Estate" },
  IWM: { label: "Russell 2000 ETF", category: "Equity" },
  TLT: { label: "20+ Year Treasury ETF", category: "Bonds" },
  GLD: { label: "Gold ETF", category: "Commodities" },
};

function RateCard({ label, value, unit = "%", desc }) {
  return (
    <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
      <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <span className="font-mono font-bold text-3xl text-slate-100">
          {value ?? <span className="text-slate-600 text-2xl">—</span>}
        </span>
        {value !== undefined && value !== null && (
          <span className="text-slate-400 text-lg mb-0.5">{unit}</span>
        )}
      </div>
      {desc && <p className="text-xs text-slate-600 mt-2">{desc}</p>}
    </div>
  );
}

function StockCard({ symbol, data }) {
  if (!data || !data.c) return null;
  const meta = ETF_META[symbol] || { label: symbol, category: "" };
  const pos = data.dp >= 0;
  return (
    <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{symbol}</p>
          <p className="text-sm text-slate-400 mt-0.5">{meta.label}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-medium ${pos ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {pos ? "+" : ""}{data.dp?.toFixed(2)}%
        </div>
      </div>
      <p className="font-mono font-bold text-2xl text-slate-100 mb-3">${data.c?.toFixed(2)}</p>
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div><p className="text-slate-600">Open</p><p className="text-slate-400">${data.o?.toFixed(2)}</p></div>
        <div><p className="text-slate-600">High</p><p className="text-emerald-400">${data.h?.toFixed(2)}</p></div>
        <div><p className="text-slate-600">Low</p><p className="text-rose-400">${data.l?.toFixed(2)}</p></div>
      </div>
    </div>
  );
}

function HousingStatCard({ label, value, desc, prefix = "", suffix = "" }) {
  return (
    <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
      <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-2 mb-2">
        <span className="font-mono font-bold text-3xl text-slate-100">
          {value !== null && value !== undefined ? `${prefix}${value}${suffix}` : <span className="text-slate-600 text-2xl">—</span>}
        </span>
      </div>
      {desc && <p className="text-xs text-slate-600 mt-2">{desc}</p>}
    </div>
  );
}

function CityCard({ city, data }) {
  if (!data || data.value === null) {
    return (
      <div className="bg-[#151A22]/60 border border-white/5 rounded-xl p-4">
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider truncate">{city}</p>
        <div className="h-4 bg-white/5 rounded mt-3 animate-pulse" />
      </div>
    );
  }
  const pos = data.yoy !== null ? data.yoy >= 0 : null;
  return (
    <div className="bg-[#151A22]/80 border border-white/5 rounded-xl p-4 hover:border-amber-500/20 hover:bg-[#1A2030]/80 transition-all">
      <p className="text-xs text-slate-500 font-mono uppercase tracking-wider truncate mb-2">{city}</p>
      <p className="font-mono font-bold text-lg text-slate-100">{data.value.toFixed(1)}</p>
      {data.yoy !== null && pos !== null && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-mono font-medium ${pos ? "text-emerald-400" : "text-rose-400"}`}>
          {pos ? <TrendingUp className="w-3 h-3 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 flex-shrink-0" />}
          {pos ? "+" : ""}{data.yoy.toFixed(1)}% YoY
        </div>
      )}
      {data.date && (
        <p className="text-xs text-slate-700 font-mono mt-1.5">{data.date}</p>
      )}
    </div>
  );
}

function SkeletonCard({ cols = "col-span-1" }) {
  return (
    <div className={`${cols} bg-[#151A22]/60 border border-white/5 rounded-xl p-4 animate-pulse`}>
      <div className="h-3 bg-white/5 rounded mb-3 w-2/3" />
      <div className="h-6 bg-white/5 rounded mb-2" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  );
}

export default function MarketsPage() {
  const [data, setData] = useState(null);
  const [housingData, setHousingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [housingLoading, setHousingLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setHousingLoading(true);
    setError(null);

    const [ratesResult, housingResult] = await Promise.allSettled([
      axios.get(`${API}/market/rates`),
      axios.get(`${API}/market/housing`),
    ]);

    if (ratesResult.status === "fulfilled") {
      setData(ratesResult.value.data);
      setLastUpdate(new Date());
    } else {
      setError("Unable to load market data. Please check your connection.");
    }
    setLoading(false);

    if (housingResult.status === "fulfilled") {
      setHousingData(housingResult.value.data);
    }
    setHousingLoading(false);
  };

  useEffect(() => {
    document.title = "Live Market Rates | FigureMyMoney";
    fetchAll();
    const id = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const etfOrder = ["SPY", "QQQ", "DIA", "VNQ", "IWM", "TLT", "GLD"];

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
                Real-time rates from the Federal Reserve (FRED), ETF prices from Finnhub, and housing data from S&P/Case-Shiller.
              </p>
            </div>
            {lastUpdate && (
              <button
                onClick={fetchAll}
                className="flex items-center gap-2 bg-white/5 border border-white/10 text-slate-400 text-sm rounded-xl px-4 py-2.5 hover:bg-white/10 transition-colors"
                data-testid="refresh-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh · {lastUpdate.toLocaleTimeString()}
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-16">
        {/* Error state */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-rose-400 text-sm" data-testid="error-message">
            {error}
          </div>
        )}

        {/* Interest Rates */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-5 h-5 text-amber-500" />
            <h2 className="font-heading text-2xl font-bold text-slate-100">Interest Rates</h2>
            <span className="text-xs text-slate-600 font-mono">Source: FRED (Federal Reserve)</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="rates-grid">
              <RateCard label="30yr Fixed Mortgage" value={data?.rates?.mortgage_30y?.toFixed(2)} desc="National average, weekly" />
              <RateCard label="15yr Fixed Mortgage" value={data?.rates?.mortgage_15y?.toFixed(2)} desc="National average, weekly" />
              <RateCard label="Fed Funds Rate" value={data?.rates?.fed_funds?.toFixed(2)} desc="Federal Reserve target rate" />
              <RateCard label="Prime Rate" value={data?.rates?.prime?.toFixed(2)} desc="Bank prime lending rate" />
              <RateCard label="SOFR" value={data?.rates?.sofr?.toFixed(2)} desc="Secured overnight financing" />
            </div>
          )}
        </section>

        {/* Market ETFs */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="font-heading text-2xl font-bold text-slate-100">Market ETFs</h2>
            <span className="text-xs text-slate-600 font-mono">Source: Finnhub</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array(7).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="stocks-grid">
              {etfOrder.map((sym) => (
                <StockCard key={sym} symbol={sym} data={data?.stocks?.[sym.toLowerCase()]} />
              ))}
            </div>
          )}
        </section>

        {/* Housing Market */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Home className="w-5 h-5 text-sky-400" />
            <h2 className="font-heading text-2xl font-bold text-slate-100">Housing Market</h2>
            <span className="text-xs text-slate-600 font-mono">Source: FRED / S&P Case-Shiller</span>
          </div>

          {/* National stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10" data-testid="housing-national-grid">
            {housingLoading ? (
              Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">National Home Price Index</p>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="font-mono font-bold text-3xl text-slate-100">
                      {housingData?.national?.hpi?.value ?? "—"}
                    </span>
                    {housingData?.national?.hpi?.yoy !== null && housingData?.national?.hpi?.yoy !== undefined && (
                      <span className={`text-sm font-mono font-medium mb-1 ${housingData.national.hpi.yoy >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {housingData.national.hpi.yoy >= 0 ? "+" : ""}{housingData.national.hpi.yoy.toFixed(1)}% YoY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">S&P/Case-Shiller National HPI (base: Jan 2000)</p>
                </div>
                <HousingStatCard
                  label="Median Home Sale Price"
                  value={housingData?.national?.median_price ? `$${(housingData.national.median_price / 1000).toFixed(0)}K` : null}
                  desc="US Median, quarterly · Source: FRED MSPUS"
                />
                <HousingStatCard
                  label="Housing Starts"
                  value={housingData?.national?.housing_starts ? `${housingData.national.housing_starts.toFixed(0)}K` : null}
                  desc="New privately owned units (annualized)"
                />
              </>
            )}
          </div>

          {/* City Markets Grid */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-4 h-4 text-slate-400" />
              <h3 className="font-heading text-lg font-semibold text-slate-200">City Home Price Index</h3>
              <span className="text-xs text-slate-600 font-mono">S&P/Case-Shiller · YoY change</span>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              data-testid="city-markets-grid"
            >
              {housingLoading
                ? Array(20).fill(0).map((_, i) => <SkeletonCard key={i} />)
                : housingData?.cities
                ? Object.entries(housingData.cities).map(([city, cityData]) => (
                    <CityCard key={city} city={city} data={cityData} />
                  ))
                : Array(20).fill(0).map((_, i) => (
                    <div key={i} className="bg-[#151A22]/60 border border-white/5 rounded-xl p-4">
                      <p className="text-xs text-slate-600 font-mono">No data</p>
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* Context / Understanding */}
        <section>
          <div className="bg-[#151A22]/50 border border-white/5 rounded-2xl p-8">
            <h3 className="font-heading font-semibold text-xl text-slate-200 mb-6">Understanding These Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-400 leading-relaxed">
              <div>
                <h4 className="text-slate-300 font-medium mb-2">Mortgage Rates & the 10-Year Treasury</h4>
                <p>30-year fixed mortgage rates closely track the 10-year Treasury yield, with a typical spread of 1.5–2.5%. When Treasury yields rise, mortgage rates follow.</p>
              </div>
              <div>
                <h4 className="text-slate-300 font-medium mb-2">Fed Funds vs Prime Rate</h4>
                <p>The Fed Funds rate is the overnight lending rate between banks. The Prime Rate is set at approximately Fed Funds + 3%. SOFR is the benchmark replacing LIBOR for adjustable-rate loans.</p>
              </div>
              <div>
                <h4 className="text-slate-300 font-medium mb-2">Case-Shiller Home Price Index</h4>
                <p>The S&P/Case-Shiller HPI measures residential real estate prices with a base value of 100 = January 2000. An index of 325 means home prices have risen ~225% since then. YoY % reflects annual price momentum.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-6 border-t border-white/5 pt-4">
              Rates updated every 3 hours from FRED. ETF prices refreshed every 5 minutes from Finnhub. Housing data from S&P/Case-Shiller monthly releases (typical 2–3 month publication lag).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
