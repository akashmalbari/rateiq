import '../styles/globals.css';
import { getLiveRates } from '../lib/marketData';
import SiteChrome from '../components/new-calculators/SiteChrome';

export const metadata = {
  metadataBase: new URL('https://rateiq.local'),
  title: {
    default: 'RateIQ Calculators',
    template: '%s | RateIQ',
  },
  description: 'Practical financial calculators for cost of living, net worth, car lease vs buy, and emergency fund planning.',
};

export default async function RootLayout({ children }) {
  const rates = await getLiveRates();

  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4184048622285488"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SiteChrome rates={rates}>{children}</SiteChrome>
      </body>
    </html>
  );
}
