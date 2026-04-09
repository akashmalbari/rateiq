import Head from 'next/head';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';
import TradingTerminal from '../../components/trading/TradingTerminal';
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
        <meta
          name="description"
          content="Admin trading intelligence terminal with native React rendering, live Finnhub market data, and strategy-based signal analysis."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <Header />
        <TradingTerminal />
        <SiteFooter />
      </div>
    </>
  );
}
