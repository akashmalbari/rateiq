import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, TrendingUp, Home, Car, BarChart2, CheckCircle, ChevronRight } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API = `${API_BASE}/api`;

const CATEGORIES = [
  {
    title: "Housing Decisions",
    desc: "Rent vs buy, mortgage comparisons, and real estate analysis",
    icon: Home,
    color: "amber",
    link: "/calculators",
    img: "https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/1b3abe9e22d6e36dff960d0aca8eca90fbfc2ff7fdea957393556ec919531502.png",
  },
  {
    title: "Lifestyle Decisions",
    desc: "Car lease vs buy, financial choices that shape daily life",
    icon: Car,
    color: "blue",
    link: "/calculators",
    img: "https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/cf4b773c3168c5b35c2f790577a3ff5e5f7ec376dda095e58db0e625cc519e09.png",
  },
  {
    title: "Wealth Decisions",
    desc: "Investing, debt payoff, retirement planning — grow what matters",
    icon: BarChart2,
    color: "emerald",
    link: "/calculators",
    img: "https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/d8b422f2475bcd5070ee963ea03ed1e837f5d38703e10a86927b5b9b56d1e48e.png",
  },
];

const POPULAR_CALCS = [
  { title: "Rent vs Buy", desc: "Compare long-term net worth of renting vs owning", link: "/calculators/rent-vs-buy", tag: "Most Popular" },
  { title: "Mortgage Calculator", desc: "Monthly payment and full amortization schedule", link: "/calculators/mortgage", tag: "" },
  { title: "Retirement Projection", desc: "Project your retirement savings and monthly income", link: "/calculators/retirement", tag: "Top Rated" },
  { title: "Debt Payoff", desc: "Avalanche vs snowball — which saves more?", link: "/calculators/debt-payoff", tag: "" },
  { title: "Car Lease vs Buy", desc: "Total cost comparison with ownership value", link: "/calculators/car-lease", tag: "" },
  { title: "Invest vs Debt", desc: "Compare expected returns to interest savings", link: "/calculators/invest-vs-debt", tag: "" },
];

const STEPS = [
  { step: "01", title: "Pick a Decision", desc: "Choose from 7+ financial calculators covering housing, lifestyle, and wealth." },
  { step: "02", title: "Enter Your Numbers", desc: "Input your actual figures. Rates, payments, timelines — all customizable." },
  { step: "03", title: "Get a Recommendation", desc: "See data-backed projections, charts, and a clear recommendation for your situation." },
];

function StatCard({ label, value, change, positive }) {
  return (
    <div className="bg-[#151A22]/80 border border-white/8 rounded-xl p-4">
      <p className="text-xs text-slate-500 font-mono mb-1">{label}</p>
      <p className="text-xl font-mono font-bold text-slate-100">{value}</p>
      {change && (
        <p className={`text-xs font-mono mt-0.5 ${positive ? "text-emerald-400" : "text-rose-400"}`}>{change}</p>
      )}
    </div>
  );
}

function BlogCard({ article }) {
  return (
    <Link to={`/blog/${article.slug}`} className="group block" data-testid={`blog-card-${article.slug}`}>
      <div className="overflow-hidden rounded-xl mb-4 aspect-video bg-[#151A22]">
        <img src={article.image_url} alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-0.5 mb-3">
        <span className="text-amber-500 text-xs font-medium">{article.category}</span>
      </div>
      <h3 className="font-heading font-semibold text-slate-100 text-lg leading-snug mb-2 group-hover:text-amber-400 transition-colors">
        {article.title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">{article.excerpt}</p>
      <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
        <span>{article.published_date}</span>
        <span>·</span>
        <span>{article.read_time} min read</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [rates, setRates] = useState(null);
  const [articles, setArticles] = useState([]);
  const [email, setEmail] = useState("");
  const [subMsg, setSubMsg] = useState("");
  const [subStatus, setSubStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Figure My Money | Smart Financial Decision Tools";
    axios.get(`${API}/market/rates`).then(r => setRates(r.data)).catch(() => {});
    axios.get(`${API}/blog/articles`).then(r => setArticles(r.data.articles?.slice(0, 3) || [])).catch(() => {});
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubMsg("");
    setSubStatus("idle");
    try {
      const { data } = await axios.post(`${API}/newsletter/subscribe`, { email, source: "footer" });
      setSubMsg(data.message);
      setSubStatus("success");
      setEmail("");
    } catch (error) {
      setSubMsg(error?.response?.data?.detail || "Something went wrong. Try again.");
      setSubStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0B0E14]">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/a7387564404e56dc2465334c86a6584ef63a96bc7d21440c169cb0c955af4481.png"
            alt="" className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 grid-pattern opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-500 text-xs font-medium font-mono">Live Market Data</span>
              </div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-100 leading-tight mb-6">
                Figure your money<br />
                <span className="gradient-text">before you decide</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
                Compare real-life financial decisions — from buying a home to paying off debt — using real data, live rates, and data-backed projections.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/calculators" data-testid="hero-cta-primary"
                  className="inline-flex items-center gap-2 bg-amber-500 text-[#0B0E14] font-semibold rounded-xl px-8 py-4 hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20">
                  Start Exploring <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/markets" data-testid="hero-cta-secondary"
                  className="inline-flex items-center gap-2 bg-white/5 text-slate-200 border border-white/10 rounded-xl px-8 py-4 hover:bg-white/10 transition-all">
                  View Live Rates
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6">
                {["No sign-up needed", "Live market data", "100% free"].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-500">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Live Stats */}
            {rates && (
              <div className="hidden lg:block animate-fade-in">
                <div className="bg-[#151A22]/60 backdrop-blur-xl border border-white/8 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-slate-300">Live Market Snapshot</p>
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="30yr Fixed" value={`${rates.rates.mortgage_30y?.toFixed(2)}%`} />
                    <StatCard label="15yr Fixed" value={`${rates.rates.mortgage_15y?.toFixed(2)}%`} />
                    <StatCard label="Fed Funds" value={`${rates.rates.fed_funds?.toFixed(2)}%`} />
                    <StatCard label="Prime Rate" value={`${rates.rates.prime?.toFixed(2)}%`} />
                    {rates.stocks?.spy && (
                      <StatCard label="S&P 500 ETF (SPY)"
                        value={`$${rates.stocks.spy.c?.toFixed(2)}`}
                        change={`${rates.stocks.spy.dp >= 0 ? "+" : ""}${rates.stocks.spy.dp?.toFixed(2)}%`}
                        positive={rates.stocks.spy.dp >= 0}
                      />
                    )}
                    {rates.stocks?.qqq && (
                      <StatCard label="NASDAQ ETF (QQQ)"
                        value={`$${rates.stocks.qqq.c?.toFixed(2)}`}
                        change={`${rates.stocks.qqq.dp >= 0 ? "+" : ""}${rates.stocks.qqq.dp?.toFixed(2)}%`}
                        positive={rates.stocks.qqq.dp >= 0}
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-3 font-mono text-center">Updated every 5 minutes • FRED + Finnhub</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-[#080B10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-100 mb-4">Explore by Decision Category</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every major financial decision, covered with data-backed tools.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat, i) => (
              <Link key={i} to={cat.link} data-testid={`category-card-${i}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] block">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-heading font-bold text-xl text-slate-100 mb-1">{cat.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1 text-amber-500 text-sm font-medium">
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Calculators */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-100 mb-4">Popular Calculators</h2>
              <p className="text-slate-400">Start with the most-used financial decision tools.</p>
            </div>
            <Link to="/calculators" className="hidden md:flex items-center gap-1.5 text-amber-500 text-sm font-medium hover:text-amber-400">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {POPULAR_CALCS.map((c, i) => (
              <Link key={i} to={c.link} data-testid={`calc-card-${i}`}
                className="group bg-[#151A22]/80 border border-white/5 rounded-2xl p-6 hover:border-amber-500/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
                {c.tag && (
                  <div className="inline-flex items-center bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5 mb-4">
                    <span className="text-amber-500 text-xs font-medium">{c.tag}</span>
                  </div>
                )}
                {!c.tag && <div className="h-6 mb-4" />}
                <h3 className="font-heading font-semibold text-lg text-slate-100 mb-2 group-hover:text-amber-400 transition-colors">{c.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{c.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-amber-500 text-sm font-medium">
                  Open calculator <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#080B10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-100 mb-4">How It Works</h2>
            <p className="text-slate-400">Three steps to smarter financial decisions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative" data-testid={`step-${i}`}>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] right-[-3rem] h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                )}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                    <span className="font-mono font-bold text-amber-500 text-lg">{s.step}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-xl text-slate-100 mb-3">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      {articles.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-14">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-100 mb-4">Latest Insights</h2>
                <p className="text-slate-400">Data-driven articles on personal finance decisions.</p>
              </div>
              <Link to="/blog" className="hidden md:flex items-center gap-1.5 text-amber-500 text-sm font-medium hover:text-amber-400">
                View all articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.map(a => <BlogCard key={a.slug} article={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-24 bg-[#080B10]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-amber-500/8 to-amber-600/4 border border-amber-500/15 rounded-3xl p-12">
            <TrendingUp className="w-10 h-10 text-amber-500 mx-auto mb-6" />
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
              Stay ahead of the market
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Weekly rate updates, financial insights, and calculator tips — delivered free to your inbox.
            </p>
            {subStatus === "success" ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-400 font-medium">{subMsg}</p>
              </div>
            ) : (
              <>
                {subStatus === "error" && subMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-3">
                    <p className="text-rose-300 font-medium">{subMsg}</p>
                  </div>
                )}
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    data-testid="newsletter-email-input"
                    className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-5 py-3 text-slate-200 text-sm placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    data-testid="newsletter-submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 text-[#0B0E14] font-semibold text-sm rounded-xl px-6 py-3 hover:bg-amber-400 transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Subscribe Free"}
                  </button>
                </form>
              </>
            )}
            <p className="text-xs text-slate-600 mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Calculators", value: "7+" },
              { label: "Data Sources", value: "FRED + Finnhub" },
              { label: "Cost", value: "100% Free" },
              { label: "Financial Advice", value: "None — Just Data" },
            ].map((t, i) => (
              <div key={i}>
                <p className="font-heading font-bold text-2xl text-amber-500 mb-1">{t.value}</p>
                <p className="text-sm text-slate-500">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
