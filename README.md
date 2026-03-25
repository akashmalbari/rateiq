# RateIQ — Financial Intelligence Platform

A Next.js MVP for investment decision-making: mortgages vs. markets, real estate by city, amortization, and personalized capital allocation.

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

Optional — the FRED API works without a key for basic usage, but you'll get higher rate limits with one:

```bash
# .env.local
FRED_API_KEY=your_key_here
```

Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html

## Project Structure

```
rateiq/
├── pages/
│   ├── index.js          # Main dashboard
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
