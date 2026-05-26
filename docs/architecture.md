# Architecture

Figure My Money is organized around a small number of production boundaries:

## Product Flow

1. Vercel Cron calls `GET /api/scans/daily` at the two UTC equivalents of 10:30 AM Eastern.
2. The route verifies `CRON_SECRET` and confirms the current `America/New_York` time.
3. `runDailyOptionsScan()` loads the NASDAQ-100 universe, evaluates market regime, fetches quotes/candles/options, filters low-quality chains, scores strategy candidates, and returns the ranked list.
4. `persistScanResult()` writes the scan and recommendations to Supabase.
5. `sendDailyDigest()` loads users with digest enabled and sends tier-aware emails through Resend.
6. The dashboard reads scanner output and presents the same fields users receive by email.

## Strategy Engine

Each strategy implements `StrategyModule`:

```ts
type StrategyModule = {
  type: StrategyType;
  name: string;
  enabledByDefault: boolean;
  evaluate(context: StrategyContext): Recommendation | null;
};
```

The scanner can add or remove strategy modules without changing the orchestration code. Current modules include cash-secured puts, covered calls, bull put credit spreads, bear call credit spreads, debit spreads, iron condors, directional calls, and directional puts.

## Market Data

`MarketDataProvider` isolates vendor dependencies:

- `DemoMarketDataProvider` is deterministic for development and tests.
- `TradierMarketDataProvider` supports quotes, candles, expirations, options chains, Greeks, volume, and open interest.
- `PolygonFinnhubMarketDataProvider` supports quote enrichment and can be composed with Tradier for options.

Providers can be extended for Alpaca, Interactive Brokers, or additional institutional feeds by implementing the same interface.

## Risk and Quality Filters

The scanner rejects or penalizes:

- Earnings dates inside the default event-risk window
- Low open interest
- Low volume
- Wide bid/ask spreads
- Poor liquidity scores
- Unfavorable IV conditions for the selected strategy
- Poor trend/momentum alignment
- High-volatility market regimes for range-bound strategies

## Database

Supabase PostgreSQL stores:

- Auth-linked user profiles
- Subscription tier state
- Scan metadata
- Strategy thresholds
- Recommendations and option legs
- Captured option contracts
- Trade outcomes
- Backtest results
- Email delivery logs

RLS lets users read their own profile/backtests/email logs while service-role API routes handle trusted scan writes.

## Extensibility

Stripe can be added by writing subscription webhook updates to `subscriptions` and `users.subscription_tier`. Premium limits are already handled at the email layer by selecting top 3 for free users and top 10 for premium users.
