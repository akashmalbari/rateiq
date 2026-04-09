import '../styles/globals.css';
import { getLiveRates } from '../lib/marketData';
import SiteChrome from '../components/new-calculators/SiteChrome';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://figuremymoney.com';

const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

export const metadata = {
  metadataBase: new URL(siteUrl),
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
        {adsenseId ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body>
        <SiteChrome rates={rates}>{children}</SiteChrome>
      </body>
    </html>
  );
}
