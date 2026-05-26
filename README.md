# Figure My Money

Production-grade Next.js application for daily high-probability NASDAQ-100 options trade ideas.

The platform scans NASDAQ-100 stocks, evaluates options chains, ranks statistically repeatable setups, stores recommendations in Supabase, and sends a premium daily digest through Resend.

## Stack

- Next.js 15 App Router, TypeScript, TailwindCSS, shadcn-style components
- Supabase Auth + PostgreSQL + RLS
- Resend transactional email
- Vercel Cron and serverless route handlers
- Recharts for dashboard analytics
- Modular market data provider layer for demo, Tradier, Polygon, Finnhub, and future providers

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Demo mode works without market-data keys. Supabase/Auth/Resend operations require the environment variables in `.env.example`.

## Required Environment

```bash
NEXT_PUBLIC_APP_URL=https://figuremymoney.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
ADMIN_EMAILS=founder@figuremymoney.com
RESEND_API_KEY=
RESEND_FROM="Figure My Money <signals@figuremymoney.com>"
MARKET_DATA_PROVIDER=demo
TRADIER_ACCESS_TOKEN=
POLYGON_API_KEY=
FINNHUB_API_KEY=
```

Use `MARKET_DATA_PROVIDER=tradier` for live options chains. `demo` is deterministic and exists so local development, tests, previews, and UI review do not depend on vendor uptime.

## Supabase Setup

1. Create a Supabase project.
2. Run [supabase/migrations/001_initial_schema.sql](/Users/amalbari/git_projects/rateiq/supabase/migrations/001_initial_schema.sql).
3. Configure Auth redirect URLs:
   - `https://figuremymoney.com/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Add `SUPABASE_SERVICE_ROLE_KEY` only to server/Vercel env vars.
5. Add founder/admin emails to `ADMIN_EMAILS`.

The schema includes `users`, `subscriptions`, `scans`, `strategies`, `recommendations`, `option_contracts`, `trade_results`, `backtests`, and `email_logs`, with indexes and RLS.

## Daily Cron

Vercel cron is UTC-based, so [vercel.json](/Users/amalbari/git_projects/rateiq/vercel.json) schedules both possible UTC times for 10:30 AM Eastern:

- `30 14 * * 1-5` for daylight time
- `30 15 * * 1-5` for standard time

The route checks `America/New_York` and runs only when the local time is 10:30 AM on a weekday, preventing duplicate seasonal runs.

## Scanner Architecture

Core files:

- [lib/trading/scanner.ts](/Users/amalbari/git_projects/rateiq/lib/trading/scanner.ts) orchestrates the daily scan.
- [lib/trading/strategies.ts](/Users/amalbari/git_projects/rateiq/lib/trading/strategies.ts) contains pluggable strategy modules.
- [lib/trading/market-data.ts](/Users/amalbari/git_projects/rateiq/lib/trading/market-data.ts) abstracts market data providers.
- [lib/trading/backtester.ts](/Users/amalbari/git_projects/rateiq/lib/trading/backtester.ts) implements lightweight historical simulation.
- [lib/email/daily-digest.ts](/Users/amalbari/git_projects/rateiq/lib/email/daily-digest.ts) renders and sends the Resend email digest.

Ranking combines probability of profit, risk/reward, liquidity, bid/ask spread quality, IV percentile, technical alignment, historical win-rate estimate, earnings risk, and market regime.

## Routes

- `/` landing page
- `/signup`, `/login`, `/reset-password`
- `/dashboard` daily trade picks and analytics
- `/backtests` lightweight strategy lab
- `/settings` profile and digest preferences
- `/admin` manual scans, logs, strategy operations
- `/risk-disclosure`, `/privacy`, `/terms`

API routes:

- `GET /api/scans/daily` Vercel Cron
- `POST /api/scans/manual` admin scan trigger
- `GET /api/recommendations` latest stored picks or demo scan
- `POST /api/backtests/run` authenticated backtest run
- `GET /api/admin/logs`
- `GET/PATCH /api/admin/strategies`

## Tests

```bash
npm run typecheck
npm test
npm run build
```

## Deployment

1. Push to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables from `.env.example`.
4. Set the domain to `figuremymoney.com`.
5. Confirm the cron route is listed under Vercel Cron Jobs.

## Risk Posture

Figure My Money is educational research software. It does not place trades, does not connect to brokerage accounts, and does not personalize recommendations. Every trade idea includes risk disclosure, max loss, exits, sizing guidance, and warnings. Options trading can result in substantial losses.
