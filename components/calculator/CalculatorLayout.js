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

        <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <section className="surface-panel p-8 md:p-10 mb-8">
            <div className="eyebrow mb-3">Scenario calculator</div>
            <h1 className="text-4xl md:text-6xl font-display font-semibold mb-4" style={{ lineHeight: 1.02, letterSpacing: '-0.04em' }}>
              {title}
            </h1>
            <p className="max-w-3xl text-base md:text-lg" style={{ color: 'var(--muted)', lineHeight: 1.85 }}>
              {description}
            </p>
          </section>

          {children}

          {explanatoryText ? (
            <section className="surface-card mt-8 p-6 md:p-7">
              <div className="eyebrow mb-3">Learn more</div>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{explanatoryText}</p>
            </section>
          ) : null}
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
