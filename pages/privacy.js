import Head from 'next/head';
import Header from '../components/Header';
import SiteFooter from '../components/SiteFooter';

export default function PrivacyPage() {
  const title = 'Privacy Policy | Figure My Money';
  const description = 'Privacy policy for Figure My Money. Learn what information we collect and how it is used.';

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
          <h1 className="text-4xl font-display font-bold mb-4">Privacy Policy</h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
            We only collect information necessary to operate and improve this website. Contact form submissions are stored securely for support and product improvement. We do not sell personal information.
          </p>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
