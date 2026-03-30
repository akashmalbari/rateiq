import Head from 'next/head';
import Header from '../components/Header';
import SiteFooter from '../components/SiteFooter';

export default function AboutPage() {
  const title = 'About Figure My Money | Financial Decision Intelligence';
  const description = 'Figure My Money is a financial decision intelligence platform focused on housing, lifestyle, and wealth calculators to help people make smarter money decisions.';

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

        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />

          <h1 className="text-4xl font-display font-bold mb-4">About Figure My Money</h1>
          <p className="mb-8" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
            Figure My Money is a financial decision intelligence platform built to help you compare major money choices with clarity.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-3">What we focus on</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              Our core focus is practical calculators across housing, lifestyle, and wealth decisions. We aim to make complex tradeoffs easier to understand with transparent assumptions and data-backed outputs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-3">Our mission</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              Our mission is simple: help people make smarter financial decisions in real life. We care more about decision quality than noise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-3">Growing calculator library</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
              We are continuously expanding our calculator library so you can evaluate more scenarios over time, from housing and debt to investing and long-term planning.
            </p>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
