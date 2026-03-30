import Head from 'next/head';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';
import { getCookieName, parseCookies, verifySessionToken } from '../../lib/trading/auth';

export async function getServerSideProps({ req }) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[getCookieName()];
  const session = verifySessionToken(token);

  if (!session || session.role !== 'admin') {
    return {
      redirect: {
        destination: '/trading/login',
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function TradingPage() {
  return (
    <>
      <Head>
        <title>Trading Intelligence | Figure My Money</title>
        <meta name="description" content="Admin trading intelligence terminal for live market signal analysis." />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <div className="rule-thick mb-1" />
          <div className="rule-thin mb-8" />
          <h1 className="text-4xl font-display font-bold mb-2">Trading Intelligence</h1>
          <p className="font-mono text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Admin-only live trading dashboard integrated into Figure My Money.
          </p>

          <div style={{ border: '1px solid var(--border)', background: 'white', borderRadius: '2px', overflow: 'hidden' }}>
            <iframe
              src="/trading_terminal.html"
              title="Trading Intelligence Terminal"
              style={{ width: '100%', height: 'calc(100vh - 280px)', minHeight: '780px', border: '0' }}
            />
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
