function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'https://figuremymoney.com'
  ).replace(/\/$/, '');
}

export async function getServerSideProps({ res }) {
  const baseUrl = getBaseUrl();

  const content = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;

  res.setHeader('Content-Type', 'text/plain');
  res.write(content);
  res.end();

  return { props: {} };
}

export default function RobotsTxt() {
  return null;
}
