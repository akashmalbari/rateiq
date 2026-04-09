import Head from 'next/head';
import Header from '../../components/Header';
import SiteFooter from '../../components/SiteFooter';
import TradingTerminal from '../../components/trading/TradingTerminal';
import { getSessionFromRequest, hasTradingAccess } from '../../lib/trading/auth';

export async function getServerSideProps({ req }) {
  const session = getSessionFromRequest(req);

  if (!hasTradingAccess(session)) {
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
          content="Private trading intelligence terminal with live Finnhub market data and strategy-based signal analysis."
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
