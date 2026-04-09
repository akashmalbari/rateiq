'use client';

import Header from '../Header';
import TickerBar from '../TickerBar';
import SiteFooter from '../SiteFooter';

export default function SiteChrome({ children, rates }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header />
      <TickerBar rates={rates} />
      {children}
      <SiteFooter />
    </div>
  );
}
