import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Clock, Tag, ArrowRight, BookOpen } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API = `${API_BASE}/api`;

const CATEGORIES = ["All", "Housing", "Lifestyle", "Wealth"];

function ArticleCard({ article, featured = false }) {
  return (
    <Link to={`/blog/${article.slug}`} data-testid={`article-card-${article.slug}`}
      className={`group block ${featured ? "" : "bg-[#151A22]/80 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/15 transition-all duration-300"}`}>
      {featured ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#151A22]/80 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all">
          <div className="aspect-video lg:aspect-auto overflow-hidden">
            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium rounded-full px-3 py-1">{article.category}</span>
              <span className="text-xs text-slate-500 font-mono">Featured</span>
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-100 leading-tight mb-4 group-hover:text-amber-400 transition-colors">{article.title}</h2>
            <p className="text-slate-400 leading-relaxed mb-6">{article.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-slate-600 font-mono mb-6">
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{article.read_time} min read</span>
              <span>{article.published_date}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-amber-500 text-sm font-medium">
              Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div className="aspect-video overflow-hidden">
            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium rounded-full px-2.5 py-0.5">{article.category}</span>
            </div>
            <h3 className="font-heading font-semibold text-lg text-slate-100 mb-2 leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">{article.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{article.excerpt}</p>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.read_time} min</span>
              <span>{article.published_date}</span>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Financial Blog & Insights | FigureMyMoney";
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${API}/blog/articles`);
        setArticles(data.articles || []);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === "All" ? articles : articles.filter(a => a.category === filter);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="bg-[#0B0E14] min-h-screen">
      {/* Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-500 text-xs font-medium">Financial Insights</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-5" data-testid="blog-title">
            Smarter money decisions<br className="hidden sm:block" /> start with better data
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Data-driven articles on housing, investing, debt, and personal finance decisions.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-wrap gap-2" data-testid="blog-category-filter">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} data-testid={`filter-${cat}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === cat ? "bg-amber-500 text-[#0B0E14]" : "bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading articles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-center py-20">No articles found.</p>
        ) : (
          <>
            {featured && (
              <div className="mb-8">
                <ArticleCard article={featured} featured={true} />
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(a => <ArticleCard key={a.slug} article={a} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
