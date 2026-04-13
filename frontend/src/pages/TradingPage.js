import { useState, useEffect, useCallback, useMemo } from "react";
import { TrendingUp, Mail, Lock, RefreshCw, AlertCircle, ChevronDown } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const STRATEGIES = [
  { value: "momentum", label: "Momentum", summary: "RSI + MACD + moving-average confirmation." },
  { value: "mean_reversion", label: "Mean Reversion", summary: "Bollinger extremes and oversold/overbought reversals." },
  { value: "breakout", label: "Breakout", summary: "Volume expansion and ATR-driven continuation setups." },
  { value: "volatility", label: "Volatility", summary: "Volatility regime and direction-aware bias." },
];

function fmtPrice(v) { return v == null || isNaN(Number(v)) ? "—" : `$${Number(v).toFixed(2)}`; }
function fmtPct(v) { return v == null || isNaN(Number(v)) ? "—" : `${Number(v).toFixed(2)}%`; }
function fmtRR(entry, stop, target) {
  const risk = Math.abs(Number(entry) - Number(stop));
  const reward = Math.abs(Number(target) - Number(entry));
  if (!risk || isNaN(risk) || isNaN(reward)) return "—";
  return `${(reward / risk).toFixed(1)}:1`;
}

function signalTone(action) {
  if (action === "BUY") return "buy";
  if (action === "SELL") return "sell";
  return "hold";
}

function ScannerRegime({ signals }) {
  if (!signals.length) return { label: "Scanner idle", tone: "hold", desc: "No scanner signals available yet." };
  const buys = signals.filter(s => s.action === "BUY").length;
  const sells = signals.filter(s => s.action === "SELL").length;
  if (buys > sells) return { label: "Bullish scanner tilt", tone: "buy", desc: `${buys} buy signals vs ${sells} sell signals.` };
  if (sells > buys) return { label: "Bearish scanner tilt", tone: "sell", desc: `${sells} sell signals vs ${buys} buy signals.` };
  return { label: "Balanced scanner", tone: "hold", desc: `Even split — ${buys} buy and ${sells} sell signals.` };
}

const TONE_STYLES = {
  buy: { pill: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", dot: "#74f0b4" },
  sell: { pill: "bg-rose-500/10 border-rose-500/30 text-rose-400", dot: "#ff8ea4" },
  hold: { pill: "bg-slate-500/10 border-slate-500/20 text-slate-400", dot: "#94a3b8" },
};

function Pill({ tone, children, large }) {
  const s = TONE_STYLES[tone] || TONE_STYLES.hold;
  return (
    <span className={`inline-flex items-center border rounded-full font-bold tracking-widest uppercase ${large ? "px-4 py-2 text-xs" : "px-3 py-1.5 text-[10px]"} ${s.pill}`}>
      {children}
    </span>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-4">
      <p className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">{label}</p>
      <p className="font-mono font-semibold text-lg" style={{ color: accent || "#e2e8f0" }}>{value ?? "—"}</p>
    </div>
  );
}

// ── Email Gate ─────────────────────────────────────────────────────────────────
function TradingGate({ onAccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/trading/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("trading_access", data.access_token);
        localStorage.setItem("trading_email", data.email);
        onAccess(data.email);
      } else {
        setError(data.detail || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0B0E14] min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-amber-500 text-xs font-mono uppercase tracking-wider">Trading Intelligence Terminal</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
            Get early access to our signal scanner
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Live technical analysis across 30 top stocks — momentum, breakout, mean reversion, and volatility signals powered by real Finnhub market data.
          </p>
        </div>

        <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-8">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { icon: "◆", label: "4 Strategies", desc: "Momentum, Breakout, Mean Rev, Volatility" },
              { icon: "◆", label: "Live Finnhub Data", desc: "Real-time quotes & technical signals" },
              { icon: "◆", label: "30 Stocks Scanned", desc: "Top S&P 500 names ranked by conviction" },
              { icon: "◆", label: "Entry & Stop Levels", desc: "ATR-based risk/reward for every signal" },
            ].map((f, i) => (
              <div key={i} className="p-3 bg-[#0B0E14] border border-white/5 rounded-xl">
                <p className="text-amber-500 text-xs font-mono mb-1">{f.label}</p>
                <p className="text-slate-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 font-mono mb-2">Your email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="trading-email-input"
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <button type="submit" disabled={loading} data-testid="trading-access-btn"
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0B0E14] font-bold text-sm rounded-xl py-3.5 transition-all active:scale-95 disabled:opacity-60">
              {loading ? "Connecting…" : "Get Free Access"}
            </button>
            <p className="text-xs text-slate-600 text-center">No credit card required. Free tier — upgrade to Pro coming soon.</p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Trading Terminal ──────────────────────────────────────────────────────────
function TradingTerminal({ userEmail, onLogout }) {
  const [symbol, setSymbol] = useState("AAPL");
  const [strategy, setStrategy] = useState("momentum");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signal, setSignal] = useState(null);
  const [scannerSignals, setScannerSignals] = useState([]);
  const [scanStatus, setScanStatus] = useState("Loading scanner results…");
  const [scanMeta, setScanMeta] = useState({ generatedAt: null, scanned: null });

  const loadScanner = useCallback(async (refresh = false) => {
    setScanStatus(refresh ? "Refreshing live scanner results…" : "Loading scanner results…");
    try {
      const res = await fetch(`${API}/api/trading/scan-results${refresh ? "?refresh=1" : ""}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "No scanner results available");
      const rows = Array.isArray(data.topSignals) ? data.topSignals : [];
      setScannerSignals(rows);
      setScanMeta({ generatedAt: data.generatedAt || null, scanned: data.scanned || null });
      setScanStatus(rows.length ? (data.source === "live" ? "Live scanner results refreshed" : "Stored scanner results loaded") : "Scanner returned zero signals for this run");
    } catch (err) {
      setScannerSignals([]);
      setScanStatus(err.message || "Unable to load scanner results");
    }
  }, []);

  useEffect(() => { loadScanner(); }, [loadScanner]);

  const analyze = useCallback(async (sym = symbol) => {
    const s = sym.trim().toUpperCase();
    if (!s) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/trading/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: s, strategy }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Unable to analyze signal");
      setSignal({ ...data, source: "live" });
      setSymbol(s);
    } catch (err) {
      setError(err.message || "Unable to analyze signal");
    } finally {
      setLoading(false);
    }
  }, [strategy, symbol]);

  const regime = useMemo(() => ScannerRegime({ signals: scannerSignals }), [scannerSignals]);

  function previewScanner(row) {
    setSignal({ ...row, source: "scanner", confidence: row.confidence });
    setSymbol(row.symbol || "");
    setStrategy(row.strategy || "momentum");
    setError("");
  }

  const tone = signal ? signalTone(signal.action) : "hold";

  return (
    <div className="bg-[#0B0E14] min-h-screen px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-3">
                <span className="text-amber-500 text-xs font-mono uppercase tracking-wider">Trading Intelligence Terminal</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-100 mb-2">Precision market radar.</h1>
              <p className="text-slate-400 text-sm max-w-xl">Track ranked scanner signals, inspect high-conviction setups, and run live analysis against real Finnhub data.</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Pill tone={regime.tone}>{regime.label}</Pill>
              <p className="text-xs text-slate-500">{regime.desc}</p>
              <p className="text-xs text-slate-600">Logged in as {userEmail}</p>
              <button onClick={onLogout} className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1">
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Ticker strip */}
        {scannerSignals.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
            {scannerSignals.slice(0, 8).map((row, i) => (
              <button key={i} onClick={() => previewScanner(row)} data-testid={`ticker-chip-${row.symbol}`}
                className="flex-shrink-0 min-w-[150px] bg-[#151A22]/80 border border-white/5 rounded-xl p-3 text-left hover:border-amber-500/20 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-amber-400">{row.symbol}</span>
                  <span className={`text-xs font-bold ${row.action === "BUY" ? "text-emerald-400" : row.action === "SELL" ? "text-rose-400" : "text-slate-400"}`}>{row.action}</span>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-100">{fmtPrice(row.entryPrice)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Conf {row.confidence}% · Rank {row.rankingScore ?? "—"}</p>
              </button>
            ))}
          </div>
        )}

        <div className="grid xl:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-heading font-semibold text-slate-200 text-sm">Scanner Signals</h3>
                <button onClick={() => loadScanner(true)} className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">{scanStatus}{scanMeta.generatedAt ? ` · ${new Date(scanMeta.generatedAt).toLocaleTimeString()}` : ""}{scanMeta.scanned ? ` · ${scanMeta.scanned} scanned` : ""}</p>
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {scannerSignals.length ? scannerSignals.slice(0, 12).map((row, i) => (
                  <button key={i} onClick={() => previewScanner(row)} data-testid={`scanner-row-${i}`}
                    className="w-full text-left bg-[#0B0E14] border border-white/5 rounded-xl p-3 hover:border-amber-500/10 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-sm text-slate-100">{row.symbol}</p>
                        <p className="text-xs text-slate-500">{(row.strategy || "").replace("_", " ")}</p>
                      </div>
                      <Pill tone={signalTone(row.action)}>{row.action}</Pill>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Conf {row.confidence}%</span>
                      <span className="font-mono text-slate-300">{fmtPrice(row.entryPrice)}</span>
                    </div>
                  </button>
                )) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No signals yet. Click Refresh to run the scanner.</p>
                )}
              </div>
            </div>

            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-slate-500 font-mono mb-3 uppercase tracking-wider">How signals work</p>
              <p className="text-xs text-slate-400 leading-relaxed">Each symbol is evaluated with a rules-based model that checks live quote data and technical inputs — RSI, MACD, volatility, volume, and trend alignment. Weak setups are filtered out. Remaining names are ranked by confidence score.</p>
            </div>
          </div>

          {/* Main analysis */}
          <div className="space-y-5">
            <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-5">
              <div className="flex gap-3 mb-5">
                <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Enter ticker (AAPL, NVDA, SPY…)"
                  data-testid="ticker-input"
                  className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl py-2.5 px-4 text-slate-200 text-sm focus:border-amber-500 outline-none transition-all font-mono"
                  onKeyDown={e => e.key === "Enter" && analyze(symbol)}
                />
                <button onClick={() => analyze(symbol)} disabled={loading} data-testid="analyze-btn"
                  className="bg-amber-500 hover:bg-amber-400 text-[#0B0E14] font-bold text-sm rounded-xl px-5 py-2.5 transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap">
                  {loading ? "Analyzing…" : "Run Analysis"}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STRATEGIES.map(s => (
                  <button key={s.value} onClick={() => setStrategy(s.value)} data-testid={`strategy-${s.value}`}
                    className={`text-left p-3 rounded-xl border transition-all ${strategy === s.value ? "bg-[#0B0E14] border-amber-500/40 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]" : "bg-[#0B0E14] border-white/5 hover:border-white/10"}`}>
                    <p className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Strategy</p>
                    <p className="font-heading font-semibold text-sm text-slate-100 mb-1">{s.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.summary}</p>
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-4 text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </div>

            {signal ? (
              <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
                  <div>
                    <p className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">{signal.source === "scanner" ? "Scanner Snapshot" : "Live Analysis"}</p>
                    <h2 className="font-heading text-3xl font-bold text-slate-100 mb-1" data-testid="signal-symbol">{signal.symbol}</h2>
                    <p className="text-slate-400 text-sm">{signal.profileName}</p>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <Pill tone={signalTone(signal.action)} large>{signal.action}</Pill>
                    <p className="text-xs text-slate-500">Strategy: {(signal.strategy || strategy).replace("_", " ")}</p>
                  </div>
                </div>

                {/* Confidence */}
                <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-xs font-mono text-slate-500 uppercase mb-1">Confidence</p>
                      <p className="font-mono font-bold text-2xl text-slate-100" data-testid="signal-confidence">{signal.confidence || 0}%</p>
                    </div>
                    {signal.rankingScore != null && (
                      <div className="text-right">
                        <p className="text-xs font-mono text-slate-500 mb-1">Rank Score</p>
                        <p className="font-mono font-bold text-xl text-amber-400">{signal.rankingScore}</p>
                      </div>
                    )}
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${signal.confidence || 0}%`, background: "linear-gradient(90deg, #4aa6ff, #74f0b4)" }} />
                  </div>
                </div>

                {/* Key levels */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                  <MetricCard label="Entry" value={fmtPrice(signal.entryPrice)} accent="#f59e0b" />
                  <MetricCard label="Stop Loss" value={fmtPrice(signal.stopLoss)} accent="#f87171" />
                  <MetricCard label="Target" value={fmtPrice(signal.targetPrice)} accent="#74f0b4" />
                  <MetricCard label="Risk / Reward" value={fmtRR(signal.entryPrice, signal.stopLoss, signal.targetPrice)} />
                </div>

                {/* Technical indicators */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
                  <MetricCard label="RSI" value={signal.indicators?.rsi} />
                  <MetricCard label="MACD Hist" value={signal.indicators?.macdHist} />
                  <MetricCard label="BB %B" value={signal.indicators?.bbPct} />
                  <MetricCard label="Stoch K" value={signal.indicators?.stochK} />
                  <MetricCard label="ATR %" value={fmtPct(signal.indicators?.atrPct)} />
                  <MetricCard label="Vol Ratio" value={signal.indicators?.volRatio ? `${signal.indicators.volRatio}x` : "—"} />
                </div>

                {/* Moving averages */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <MetricCard label="50 SMA" value={fmtPrice(signal.indicators?.sma50)} />
                  <MetricCard label="200 SMA" value={fmtPrice(signal.indicators?.sma200)} />
                  <MetricCard label="Volatility %" value={fmtPct(signal.indicators?.ivPct)} />
                  <MetricCard label="Score Split" value={signal.scoreBreakdown ? `${signal.scoreBreakdown.bull} / ${signal.scoreBreakdown.bear}` : "—"} />
                </div>

                {/* Reasoning */}
                {signal.reasons?.length > 0 && (
                  <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-4 mb-4">
                    <p className="text-xs font-mono text-slate-500 uppercase mb-3">Signal Reasoning</p>
                    <ul className="space-y-2">
                      {signal.reasons.slice(0, 6).map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-amber-500 mt-0.5 flex-shrink-0">›</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => analyze(signal.symbol || symbol)} disabled={loading} data-testid="refresh-signal-btn"
                    className="flex-1 bg-white/5 border border-white/10 text-slate-200 text-sm font-medium rounded-xl py-2.5 hover:bg-white/8 transition-all">
                    Refresh Live
                  </button>
                  <button onClick={() => setSignal(null)}
                    className="flex-1 bg-white/5 border border-white/10 text-slate-200 text-sm font-medium rounded-xl py-2.5 hover:bg-white/8 transition-all">
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-10 text-center">
                <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                <h3 className="font-heading font-semibold text-xl text-slate-300 mb-2">Ready to analyze</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">Click a scanner signal from the sidebar to preview it instantly, or enter a ticker and run live analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main TradingPage ──────────────────────────────────────────────────────────
export default function TradingPage() {
  const [accessEmail, setAccessEmail] = useState(null);

  useEffect(() => {
    document.title = "Trading Intelligence Terminal | FigureMyMoney";
    const stored = localStorage.getItem("trading_access");
    const email = localStorage.getItem("trading_email");
    if (stored && email) setAccessEmail(email);
  }, []);

  function handleAccess(email) { setAccessEmail(email); }
  function handleLogout() {
    localStorage.removeItem("trading_access");
    localStorage.removeItem("trading_email");
    setAccessEmail(null);
  }

  if (!accessEmail) return <TradingGate onAccess={handleAccess} />;
  return <TradingTerminal userEmail={accessEmail} onLogout={handleLogout} />;
}
