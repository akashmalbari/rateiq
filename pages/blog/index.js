import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';
import { getAllBlogPosts } from '../../data/blogPosts';

export async function getServerSideProps() {
  return {
    props: {
      posts: getAllBlogPosts(),
    },
  };
}

export default function BlogIndexPage({ posts }) {
  const title = 'Finance Blog | Real Estate, Markets, Oil, Tech & Macro Insights';
  const description =
    'SEO-focused finance blog covering real estate trends, stock market outlooks, oil and energy analysis, technology investing, and macroeconomic strategy.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />

        <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="surface-panel p-8 md:p-10 mb-8">
            <div className="eyebrow mb-3">Figure My Money Blog</div>
            <h1 className="text-4xl md:text-6xl font-display font-semibold mb-4" style={{ lineHeight: 1.02 }}>
              Clear market analysis for smarter financial decisions.
            </h1>
            <p className="text-base md:text-lg max-w-4xl" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              Explore practical insights across real estate, markets, energy, technology, and macro trends—written to help you evaluate risk, compare scenarios, and act with confidence.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="surface-card p-6 md:p-7 block">
                <div className="eyebrow mb-3">{post.category}</div>
                <h2 className="text-2xl md:text-3xl font-display font-semibold mb-3" style={{ lineHeight: 1.1 }}>
                  {post.title}
                </h2>
                <p className="mb-4" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {post.keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="stat-chip">{keyword}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                  <span className="link-arrow">Read article</span>
                </div>
              </Link>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
