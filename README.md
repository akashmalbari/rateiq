# Figure My Money

Production-grade Next.js application for daily high-probability options trade ideas across NASDAQ-100, price-screened stocks, and administrator-managed tickers.

The platform scans NASDAQ-100 stocks, a curated $10-$99.99 pool, and up to 100 Admin's Picks maintained in the operations console. Every universe uses the same options-chain, Greek, liquidity, spread, trend, earnings, theta, and risk logic. It stores ranked recommendations in Supabase, sends a daily digest through Resend, and forward-tests the strategy in an autonomous paper portfolio.

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
SUPABASE_SCHEDULER_SECRET=
ADMIN_EMAILS=founder@figuremymoney.com
RESEND_API_KEY=
RESEND_FROM="Figure My Money <signals@figuremymoney.com>"
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_ESSENTIAL_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=
MARKET_DATA_PROVIDER=demo
TRADIER_ACCESS_TOKEN=
TRADIER_API_KEY=
TRADER_API_KEY=
POLYGON_API_KEY=
FINNHUB_API_KEY=
```

Use `MARKET_DATA_PROVIDER=tradier` for live options chains. The app accepts `TRADIER_ACCESS_TOKEN`, `TRADIER_API_KEY`, or `TRADER_API_KEY` as aliases for the same Tradier bearer token. `demo` is deterministic and exists so local development, tests, previews, and UI review do not depend on vendor uptime.

## Supabase Setup

1. Create a Supabase project.
2. Run every SQL migration in [supabase/migrations](/Users/amalbari/git_projects/rateiq/supabase/migrations) in numeric order. Migration `004_automated_paper_portfolio.sql` creates and seeds the $25,000 paper account and its atomic trade functions.
3. Configure Auth redirect URLs:
   - `https://figuremymoney.com/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Add `SUPABASE_SERVICE_ROLE_KEY` only to server/Vercel env vars.
5. Add founder/admin emails to `ADMIN_EMAILS` using the exact Supabase login email. `TRADING_ADMIN_USERNAME` is also honored for legacy deployments only when its value is an email address.

The schema includes `users`, `subscriptions`, `subscription_coupons`, `premium_invites`, `billing_webhook_events`, `scans`, `strategies`, `recommendations`, `option_contracts`, `trade_results`, `recommendation_expiration_outcomes`, `backtests`, and `email_logs`, with indexes and RLS. Migration `008_recommendation_expiration_outcomes.sql` adds the recommendation expiration ledger and its after-close scheduler. Migration `009_essential_premium_tiers.sql` renames the original `free` tier to `essential`. Migration `010_subscription_billing.sql` adds webhook-safe billing synchronization, coupon storage, and plan-aware RLS. Migration `011_premium_invites.sql` adds hashed, one-time private-launch invitations and Premium entitlements.

## Subscription Access

- Essential (`$6.99/month`) receives up to 10 ranked ideas in each trading-day email digest.
- Premium (`$11.99/month`) adds the Dashboard, Track Record, Paper Portfolio, and Backtests.
- Administrators retain Premium access and are the only users allowed to run live scans manually or through ticker search.
- Scheduled scans authenticate as system jobs through the scheduler secret and continue to run independently of user access.

## Stripe Billing Setup

1. Create monthly recurring Stripe prices for Essential at `$6.99` and Premium at `$11.99`.
2. Keep `BILLING_ENABLED=false` while paid enrollment is closed. Set it to `true` only after the live Stripe account, products, prices, webhook, and portal are ready.
3. Add their `price_...` identifiers to `STRIPE_ESSENTIAL_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` in Vercel.
4. Add the Stripe secret key to `STRIPE_SECRET_KEY` in Vercel. Never expose it through a `NEXT_PUBLIC_` variable.
5. Create a Stripe webhook endpoint at `https://figuremymoney.com/api/billing/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, and `customer.subscription.resumed`.
6. Add the endpoint signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel.
7. Configure the Stripe Customer Portal to allow plan changes, payment-method updates, invoice history, and cancellation.

Checkout accepts Stripe promotion codes. Administrators create percentage-based codes in `/admin`; the server creates both the Stripe coupon and its customer-facing promotion code, then records the identifiers in Supabase. A return from Checkout never grants access directly. Only a verified Stripe webhook can update the authoritative subscription record and application entitlement.

## Private Launch Invitations

Paid enrollment is disabled by default with `BILLING_ENABLED=false`. Administrators can generate one-time Premium invitations in `/admin`, set a redemption deadline, and revoke them later. Invitations are not bound to an email address; the first authenticated user to redeem one receives access. Only a SHA-256 hash of the token is stored. Redemption is performed by a row-locking PostgreSQL function, so concurrent requests cannot use the same invitation twice.

## Automated Scheduling

Scheduling is managed by Supabase `pg_cron`, not Vercel Cron, so the app works on Vercel Hobby without its once-daily and hourly-precision restrictions. Migration `005_supabase_cron_scheduler.sql` schedules both possible UTC times for 10:30 AM Eastern:

- `30 14 * * 1-5` for daylight time
- `30 15 * * 1-5` for standard time

The route checks `America/New_York` and runs only when the local time is 10:30 AM on a weekday, preventing duplicate seasonal runs.

The paper monitor calls `/api/paper/monitor` every 15 minutes across the possible Eastern market-hours UTC window. The route itself admits only weekday cycles from 10:45 AM through 3:45 PM Eastern.

The expiration evaluator calls `/api/outcomes/settle` at 4:30 PM Eastern on weekdays. It backfills any recommendation whose expiration close was not previously available, records the underlying close and modeled assignment state once, and exposes weekly results at `/track-record`.

Before running migration `005`, create two encrypted Supabase Vault secrets in SQL Editor. Use the exact same `SUPABASE_SCHEDULER_SECRET` value configured in Vercel. `CRON_SECRET` remains a compatibility fallback only:

```sql
select vault.create_secret('https://figuremymoney.com', 'figure_my_money_app_url');
select vault.create_secret('YOUR_EXISTING_VERCEL_SCHEDULER_SECRET', 'figure_my_money_cron_secret');
```

After the migration, confirm the schedules with:

```sql
select jobid, jobname, schedule, active from cron.job order by jobname;
```

## Autonomous Paper Portfolio

The paper portfolio is a forward simulation, not a synthetic historical backtest and not a brokerage connection. It:

- Starts with exactly `$25,000` and never uses margin.
- Opens one-contract cash-secured puts or covered-call buy-writes from the 10:30 AM scan.
- Caps one position at 40% of equity, total deployed capital at 80%, and open positions at three.
- Uses fill prices penalized toward the bid/ask plus five basis points of stock slippage and a `$0.65` option fee.
- Closes at an 8% whole-position loss, 50% premium profit, 2x option-premium loss, 7 DTE, or imminent earnings.
- Marks open positions every 15 minutes and writes a daily equity snapshot.
- Stores immutable orders, cash ledger events, position marks, closed results, and versioned strategy parameters in Supabase.
- Exposes `/paper` as a portfolio dashboard and `/api/paper/export` as a spreadsheet-ready CSV journal.

Administrators can add or withdraw paper account capital from `/paper`. Funding adjustments are recorded in `paper_ledger` and `paper_accounts.net_contributions`; they are excluded from strategy P/L. Open deployed capital remains calculated from `paper_positions.capital_deployed` so funding cannot override position-level risk controls.

The database uses unique job keys and atomic PostgreSQL functions so duplicate cron deliveries cannot open or close a trade twice.

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
- `/track-record` weekly expiration outcomes and assignment-avoidance history
- `/backtests` lightweight strategy lab
- `/paper` autonomous paper portfolio, equity curve, trade journal, and monthly results
- `/settings` profile and digest preferences
- `/admin` manual scans, logs, strategy operations
- `/risk-disclosure`, `/privacy`, `/terms`

API routes:

- `GET /api/scans/daily` Vercel Cron
- `GET /api/paper/monitor` 15-minute paper risk monitor
- `GET /api/outcomes/settle` after-close recommendation expiration settlement
- `GET /api/paper/export` authenticated CSV trade journal
- `POST /api/billing/checkout` authenticated Stripe Checkout session
- `POST /api/billing/portal` authenticated Stripe Customer Portal session
- `GET /api/billing/status` authenticated entitlement status
- `POST /api/billing/webhook` signed Stripe subscription lifecycle events
- `POST /api/invites/redeem` authenticated one-time Premium invitation redemption
- `POST /api/scans/manual` admin scan trigger
- `GET /api/recommendations` latest stored picks or demo scan
- `POST /api/backtests/run` authenticated backtest run
- `GET /api/admin/logs`
- `GET/PUT /api/admin/picks`
- `GET/POST /api/admin/coupons` and `DELETE /api/admin/coupons/:id`
- `GET/POST /api/admin/invites` and `DELETE /api/admin/invites/:id`
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

Figure My Money is educational research software. It simulates paper trades but does not place live brokerage orders, connect to funded brokerage accounts, or personalize recommendations. Every trade idea includes risk disclosure, max loss, exits, sizing guidance, and warnings. Simulated results do not guarantee live performance, and options trading can result in substantial losses.
