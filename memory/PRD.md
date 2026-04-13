# FigureMyMoney — Product Requirements Document

## Original Problem Statement
Redesign figuremymoney.com from scratch as a sleek, dark, premium financial services website with:
- Multiple financial calculators (rent vs buy, mortgage, car lease, debt payoff, retirement, invest vs debt, stock returns)
- Trading tab with Finnhub-powered signal logic
- Live market data (FRED + Finnhub APIs)
- SEO-friendly Blog/Content section
- Google AdSense integration
- Mobile-friendly, modern, dark theme
- V3 GitHub repo logic ported into existing React+FastAPI stack

## Tech Stack
- **Frontend**: React SPA (Create React App + Tailwind CSS + Shadcn/UI + Recharts)
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **APIs**: Finnhub (market data + trading signals), FRED (economic data)
- **Fonts**: Manrope (headings), IBM Plex Sans (body), JetBrains Mono (mono)
- **Theme**: Dark premium fintech (bg-[#0B0E14], amber accent)

## Architecture
```
/app
├── backend/
│   ├── server.py          — FastAPI app with all routes
│   └── .env               — MONGO_URL, DB_NAME, FINNHUB_API_KEY, FRED_API_KEY
├── frontend/
│   ├── src/
│   │   ├── App.js         — Router with all routes
│   │   ├── components/    — Navbar, Footer, MarketTicker, AdSenseSlot, ComparisonBar, FAQSection
│   │   └── pages/
│   │       ├── HomePage.js, CalculatorsHub.js, MarketsPage.js, BlogPage.js, BlogArticle.js
│   │       ├── TradingPage.js  — Gated Trading Terminal
│   │       └── calculators/   — 11 calculator pages
│   └── .env               — REACT_APP_BACKEND_URL
└── memory/
    └── test_credentials.md
```

## User Personas
- Personal finance decision-makers (renting vs buying, debt strategy)
- DIY investors seeking trading signals
- Real estate and lifestyle planners

## Core Features Implemented

### Phase 1 — Foundation (DONE, Jan 2026)
- [x] 7 financial calculators (Rent vs Buy, Mortgage, Car Lease, Debt Payoff, Retirement, Invest vs Debt, Stock Returns)
- [x] FRED API integration (Fed Funds Rate, 30Y Mortgage, SOFR, etc.)
- [x] Finnhub live ticker (SPY, QQQ, DIA, AAPL, etc.)
- [x] Markets page with live data and economic indicators
- [x] Blog/Content section (6 initial articles seeded to MongoDB)
- [x] Google AdSense placeholder (pub-4184048622285488)
- [x] Dark premium theme, responsive design

### Phase 2 — V3 Port (DONE, Apr 2026)
- [x] 4 new calculators from V3 repo:
  - Cost of Living (11 major US cities comparison)
  - Net Worth (assets vs liabilities balance sheet)
  - Emergency Fund (3/6/12 month reserve calculator)
  - Buy vs Invest (home equity vs portfolio comparison)
- [x] Shared ComparisonBar.js component
- [x] Shared FAQSection.js component (accordion, added to new calculators)
- [x] Trading Terminal (gated with email gate):
  - Email gate: POST /api/trading/subscribe → localStorage
  - Python trading engine: RSI, MACD, Bollinger Bands, ATR, Stochastic
  - 4 strategies: Momentum, Mean Reversion, Breakout, Volatility
  - 30-stock scanner (CORE_30 S&P names) with ranking
  - POST /api/trading/analyze → live Finnhub signal
  - GET /api/trading/scan-results → cached 8h scanner results
  - Signal ranking algorithm ported from V3 ranking.js
- [x] 4 new V3 blog articles seeded to MongoDB
- [x] Updated Navbar: Trading link with "Pro" badge, 11 calculator dropdown
- [x] CalculatorsHub updated: 11 calculators, "New" badges on 4 new ones

## API Endpoints Reference
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/market/ticker | Live market data (Finnhub + FRED) |
| GET | /api/market/economic-data | Full FRED economic data |
| GET | /api/blog/articles | All blog articles |
| GET | /api/blog/article/{slug} | Single blog article |
| POST | /api/newsletter/subscribe | Newsletter email subscribe |
| POST | /api/trading/subscribe | Trading gate email subscribe |
| POST | /api/trading/analyze | Live signal analysis for ticker |
| GET | /api/trading/scan-results | Scanner results (30 stocks, cached 8h) |

## Database Collections
- `blog_articles` — 10 articles (6 original + 4 V3)
- `newsletter_subs` — newsletter email subscribers
- `trading_subscribers` — trading gate email subscribers
- `trading_daily_scan` — cached scanner results (8h TTL)

## Environment Variables
- Backend: MONGO_URL, DB_NAME, FINNHUB_API_KEY, FRED_API_KEY
- Frontend: REACT_APP_BACKEND_URL

## Prioritized Backlog

### P0 (Critical / Next Sprint)
- None currently (all Phase 2 items done)

### P1 (Upcoming)
- Trading monetization (Part 2): Stripe paywall for Pro tier signals
- Google AdSense rendering optimization across pages
- FAQ sections for existing 7 calculators (currently only on 4 new ones)

### P2 (Future)
- Dynamic blog backend fetching (currently seeded/static)
- Real candle-based technical indicators (currently quote-only estimation)
- Trading watchlist/portfolio tracker
- Email digest for trading signals (SendGrid/Resend integration)
- User accounts with saved calculations

## Design Guidelines
See /app/design_guidelines.json — "Premium Fintech Dark" archetype
Colors: bg-[#0B0E14] base, bg-[#151A22] surface, amber-500 accent
Fonts: Manrope + IBM Plex Sans + JetBrains Mono
