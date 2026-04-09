import { Head, Html, Main, NextScript } from 'next/document';

const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {adsenseId ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
