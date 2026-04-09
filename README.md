# Figure My Money — Financial Decision Engine Platform

A Next.js MVP for financial decision-making across housing, lifestyle, and wealth scenarios using data-driven comparisons.

## Features

- **Live rate dashboard** — 30yr/15yr mortgage, Fed Funds, Prime (via FRED API)
- **Capital Advisor** — 3-step flow: tell us your money → get allocation breakdown (market %, real estate %, bonds %, cash %)
- **Buy vs. Invest engine** — real comparison by city with real mortgage rates
- **Amortization calculator** — full year-by-year schedule
- **Markets page** — 15 real estate cities + 6 index funds with historical returns

## Tech Stack

- **Next.js 14** (App Router compatible, using Pages Router for simplicity)
- **FRED API** (free, Federal Reserve) for live mortgage + interest rates
- **Tailwind CSS** for styling
- **No database needed** — MVP uses curated static data for markets/funds

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel

# Follow prompts — it auto-detects Next.js
```

Or just push to GitHub and import the repo at vercel.com/new.

## Environment Variables

Use the following env vars in Vercel (Production/Preview/Development as needed):

### Public (safe for browser / must be prefixed `NEXT_PUBLIC_`)

```bash
NEXT_PUBLIC_SITE_URL=https://figuremymoney.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# optional fallback if your project uses publishable key naming
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
NEXT_PUBLIC_ADSENSE_ID=ca-pub-xxxxxxxxxxxxxxxx
```

### Server-only (do NOT expose to client)

```bash
FRED_API_KEY=...
FINNHUB_API_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=signals@figuremymoney.com
SUPABASE_SERVICE_ROLE_KEY=...

TRADING_ADMIN_USERNAME=...
TRADING_ADMIN_PASSWORD=...
TRADING_SESSION_SECRET=...

CRON_SECRET=...
DAILY_SIGNALS_RECIPIENTS=email1@example.com,email2@example.com
DAILY_SIGNALS_EMAIL_COUNT=30
```

### Notes on naming compatibility

- `SITE_URL` is supported on server routes as a fallback, but `NEXT_PUBLIC_SITE_URL` is preferred and should be set.
- The code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` first, then `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` as fallback.
- Variables like `PRO_API_KEY`, `SUBSCRIBE_API_KEY`, `SUBSCRIBE_ENDPOINT`, and `TRADING_PASSWORD` are currently not referenced in code.

### AdSense compliance checklist

- Set `NEXT_PUBLIC_ADSENSE_ID` to your real publisher id (`ca-pub-...`).
- Keep one consistent publisher id across `app/` and `pages/` routes (now env-driven in both `app/layout.js` and `pages/_document.js`).
- Ensure `/privacy` includes AdSense disclosure and cookie usage language.
- Avoid ad placement on login/admin/trading auth pages and avoid accidental clickable overlap near nav/buttons.

### Subscribers storage + API

- SQL setup script is included at: `supabase/subscribers.sql`
- Run it once in Supabase SQL editor.
- Use `POST /api/subscribe` with `{ "email": "user@example.com", "source": "site" }` to create/reactivate.
- Use `DELETE /api/subscribe` with `{ "email": "user@example.com" }` to deactivate.
- Use one-click `GET /api/unsubscribe?email=...&token=...` links for email campaigns.
  - Tokens are HMAC-signed using `TRADING_SESSION_SECRET` (fallback `CRON_SECRET`).
  - Daily-signal emails now include unsubscribe links automatically via `lib/trading/mailer.js`.

This keeps browser clients off direct DB writes and uses server-side `SUPABASE_SERVICE_ROLE_KEY` safely.

Get a free FRED key at: https://fred.stlouisfed.org/docs/api/api_key.html

## Project Structure

```
figuremymoney/
├── pages/
│   ├── index.js          # Decision hub homepage
│   ├── advisor.js        # Capital allocation advisor (core feature)
│   ├── calculator.js     # Amortization calculator
│   ├── markets.js        # All RE markets + index funds
│   └── api/
│       ├── rates.js      # FRED rate fetching endpoint
│       └── amortize.js   # Amortization API endpoint
├── components/
│   ├── Header.js
│   ├── TickerBar.js      # Live scrolling rate ticker
│   └── RateCard.js
├── lib/
│   └── marketData.js     # All data logic, calculators, allocation engine
└── styles/
    └── globals.css
```

## Phase 2 Roadmap

- [ ] Replace static RE data with Zillow API
- [ ] Add live index prices via Alpha Vantage or Polygon.io
- [ ] Email capture + weekly rate newsletter
- [ ] Lender lead gen forms (monetization)
- [ ] SEO: programmatic city pages ("Is it a good time to buy in Austin?")
- [ ] User accounts to save/revisit scenarios
- [ ] AI narrative layer (Claude API) for personalized written summaries

## Data Sources

- Interest rates: [FRED / St. Louis Fed](https://fred.stlouisfed.org/)
- RE appreciation: Zillow Research + FHFA historical averages (updated manually for MVP)
- Index fund returns: Trailing averages as of 2024 (update quarterly)

## Disclaimer

This tool is for informational purposes only. Not financial advice. Past performance does not guarantee future results. Always consult a licensed financial advisor.
