import Head from 'next/head';
import Header from '../Header';
import TickerBar from '../TickerBar';
import SiteFooter from '../SiteFooter';

export default function CalculatorLayout({
  title,
  description,
  rates,
  children,
  seoTitle,
  seoDescription,
  explanatoryText,
}) {
  return (
    <>
      <Head>
        <title>{seoTitle || title}</title>
        <meta name="description" content={seoDescription || description} />
        <meta property="og:title" content={seoTitle || title} />
        <meta property="og:description" content={seoDescription || description} />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        {rates ? <TickerBar rates={rates} /> : null}

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />
          <h1 className="text-4xl font-display font-bold mb-2">{title}</h1>
          <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {description}
          </p>

          {children}

          {explanatoryText ? (
            <section className="mt-8" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px' }}>
              <h2 className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                Learn More
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{explanatoryText}</p>
            </section>
          ) : null}
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
