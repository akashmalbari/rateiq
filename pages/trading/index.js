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
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <div style={{ border: '1px solid var(--border)', background: '#0b0f16', borderRadius: '4px', overflow: 'hidden' }}>
            <iframe
              src="/apex_signals.html"
              title="Trading Scanner Terminal"
              style={{ width: '100%', height: 'calc(100vh - 220px)', minHeight: '720px', border: '0' }}
            />
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
