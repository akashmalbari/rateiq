import Head from 'next/head';
import Header from '../Header';
import TickerBar from '../TickerBar';

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
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        {rates ? <TickerBar rates={rates} /> : null}

        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />
          <h1 className="text-4xl font-display font-bold mb-2">{title}</h1>
          <p className="font-mono text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {description}
          </p>

          {children}

          {explanatoryText ? (
            <div className="mt-8" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '2px', padding: '20px' }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                Learn More
              </div>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{explanatoryText}</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
