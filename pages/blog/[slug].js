import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';
import { getAllBlogPosts, getBlogPostBySlug } from '../../data/blogPosts';

export async function getServerSideProps({ params }) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
      related: getAllBlogPosts().filter((item) => item.slug !== post.slug).slice(0, 3),
    },
  };
}

export default function BlogPostPage({ post, related }) {
  const title = `${post.title} | Figure My Money Blog`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={post.description} />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />

        <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <article className="surface-panel p-8 md:p-10">
            <div className="eyebrow mb-3">{post.category}</div>
            <h1 className="text-4xl md:text-6xl font-display font-semibold mb-4" style={{ lineHeight: 1.03 }}>
              {post.title}
            </h1>
            <p className="text-base md:text-lg mb-5" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              {post.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {post.keywords.map((keyword) => (
                <span key={keyword} className="stat-chip">{keyword}</span>
              ))}
            </div>
            <div className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
              {new Date(post.date).toLocaleDateString()} · {post.readTime}
            </div>

            <div className="space-y-6 text-base md:text-lg" style={{ color: '#d8e7fb', lineHeight: 1.9 }}>
              {post.content.map((paragraph) => (
                <p key={paragraph.slice(0, 60)}>{paragraph}</p>
              ))}
            </div>
          </article>

          <section className="mt-8 surface-card p-6 md:p-7">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-display font-semibold">Related reads</h2>
              <Link href="/blog" className="link-arrow">
                Back to blog
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`} className="surface-muted p-4 block">
                  <div className="eyebrow mb-2">{item.category}</div>
                  <h3 className="font-semibold mb-2" style={{ lineHeight: 1.4 }}>
                    {item.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                    {item.readTime}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
