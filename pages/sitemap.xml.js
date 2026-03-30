const staticPaths = [
  '',
  '/about',
  '/contact',
  '/privacy',
  '/advisor',
  '/calculator',
  '/markets',
  '/indexfunds',
  '/decisions',
  '/decisions/housing',
  '/decisions/lifestyle',
  '/decisions/wealth',
  '/decisions/housing/rent-vs-buy',
  '/decisions/housing/mortgage-vs-invest',
  '/decisions/lifestyle/car-lease-vs-buy',
  '/decisions/lifestyle/childcare-vs-stay-home',
  '/decisions/wealth/invest-vs-debt',
  '/decisions/wealth/lump-sum-vs-dca',
  '/decisions/wealth/retirement',
];

export async function getServerSideProps({ res }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://figuremymoney.com';

  const urls = staticPaths
    .map((path) => `<url><loc>${baseUrl}${path}</loc></url>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SitemapXml() {
  return null;
}
