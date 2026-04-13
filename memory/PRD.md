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

### Phase 3 — Markets Page Enhancement (DONE, Feb 2026)
- [x] `/api/market/rates` expanded: now returns 7 ETFs (SPY, QQQ, DIA, VNQ, IWM, TLT, GLD)
- [x] New `/api/market/housing` endpoint: national HPI (S&P/Case-Shiller), median price (FRED MSPUS), housing starts (FRED HOUST), + 20 city Case-Shiller indices with YoY change
- [x] `fetch_fred_hpi_with_yoy()` — fetches 16 monthly observations → computes YoY % change; 3-hour in-memory cache
- [x] MarketsPage.js fully rebuilt: Interest Rates (5 cards), Market ETFs (7-card grid), Housing Market (national 3-card + 20-city grid with color-coded YoY), Understanding section
- [x] Proper error handling (error banner, skeleton loading states, null-safe optional chaining)
- [x] 4 new calculators (Cost of Living, Net Worth, Emergency Fund, Buy vs Invest)
- [x] ComparisonBar + FAQSection shared components
- [x] **Trading Terminal — Supabase-backed full auth (Apr 2026)**:
  - V3-faithful login/register UI (dark glassmorphism, Sign In / Register tabs)
  - Backend auth: scrypt password hashing + HMAC session tokens (matches V3 auth.js)
  - Supabase REST API integration (reads env: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY)
  - `POST /api/trading/register` → creates user in Supabase `trading_users` table
  - `POST /api/trading/login` → verifies password + returns HMAC session token
  - `GET /api/trading/me` → verify Bearer token + return user profile
  - `POST /api/trading/analyze` → auth-protected + stores signal in Supabase `trading_signals`
  - `GET /api/trading/scan-results` → auth-protected scanner results
  - `GET /api/trading/signal-stats/{symbol}/{strategy}` → win rate / avg return from Supabase
  - Full V3 TradingTerminal UI: ticker strip, scanner sidebar, strategy cards, confidence bar, signal reasoning
- [x] 4 new blog articles seeded (V3 content)
- [x] Navbar: Trading "Pro" badge, 11 calculators in dropdown
- [x] CalculatorsHub: 11 calculators with "New" badges

## API Endpoints Reference
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/market/ticker | Live market ticker (Finnhub + FRED) |
| GET | /api/market/rates | 5 FRED rates + 7 ETF prices (SPY/QQQ/DIA/VNQ/IWM/TLT/GLD) |
| GET | /api/market/housing | National HPI + 20 Case-Shiller city indices with YoY |
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
- None currently (Markets page fully fixed and expanded)

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
