import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Clock, ArrowLeft, Tag, Share2 } from "lucide-react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API = `${API_BASE}/api`;

export default function BlogArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/blog/articles/${slug}`);
        setArticle(data);
        document.title = `${data.title} | FigureMyMoney`;
        const { data: allData } = await axios.get(`${API}/blog/articles`);
        setRelated((allData.articles || []).filter(a => a.slug !== slug && a.category === data.category).slice(0, 3));
      } catch { setError(true); } finally { setLoading(false); }
    };
    fetch();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !article) return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center gap-4">
      <p className="text-slate-400 text-lg">Article not found.</p>
      <Link to="/blog" className="text-amber-500 hover:text-amber-400">← Back to Blog</Link>
    </div>
  );

  return (
    <div className="bg-[#0B0E14] min-h-screen">
      {/* Hero */}
      <div className="relative h-64 sm:h-96 overflow-hidden">
        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative pb-24">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Article header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium rounded-full px-3 py-1">{article.category}</span>
            {article.tags?.map(t => (
              <span key={t} className="bg-white/5 border border-white/10 text-slate-500 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />{t}
              </span>
            ))}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 leading-tight mb-6" data-testid="article-title">
            {article.title}
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5 text-sm text-slate-500 font-mono">
              <span>{article.author}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{article.read_time} min read</span>
              <span>{article.published_date}</span>
            </div>
            <button
              data-testid="share-button"
              onClick={() => navigator.share?.({ title: article.title, url: window.location.href })}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>

        {/* Editorial note */}
        <div className="mb-10 bg-[#151A22]/50 border border-white/5 rounded-xl p-5">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-2">Editorial note</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            This article is educational content based on publicly available data and assumptions current at publication time.
            It is not personalized financial advice. Always verify current rates, tax rules, and local market conditions before acting.
          </p>
        </div>

        {/* Content */}
        <article
          data-testid="article-content"
          className="blog-content prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-2">
            {article.tags.map(t => (
              <span key={t} className="bg-white/5 border border-white/10 text-slate-500 text-xs rounded-full px-3 py-1.5 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />{t}
              </span>
            ))}
          </div>
        )}

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-16">
            <h3 className="font-heading font-bold text-2xl text-slate-100 mb-8">Related Articles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`}
                  className="group bg-[#151A22]/80 border border-white/5 rounded-xl overflow-hidden hover:border-amber-500/15 transition-all">
                  <div className="aspect-video overflow-hidden">
                    <img src={a.image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <h4 className="font-heading font-semibold text-sm text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-2">{a.title}</h4>
                    <p className="text-xs text-slate-600 font-mono mt-2">{a.read_time} min read</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
