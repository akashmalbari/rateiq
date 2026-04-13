from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import os
import logging
import httpx
import asyncio
import time
import uuid

try:
    import finnhub
    FINNHUB_AVAILABLE = True
except ImportError:
    FINNHUB_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[os.environ['DB_NAME']]

FINNHUB_API_KEY = os.environ.get('FINNHUB_API_KEY', '')
FRED_API_KEY = os.environ.get('FRED_API_KEY', '')

finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY) if (FINNHUB_AVAILABLE and FINNHUB_API_KEY) else None
executor = ThreadPoolExecutor(max_workers=4)

_cache: dict = {}

def get_cached(key: str, ttl: int):
    if key in _cache:
        value, ts = _cache[key]
        if time.time() - ts < ttl:
            return value
    return None

def set_cached(key: str, value):
    _cache[key] = (value, time.time())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

FRED_FALLBACK = {
    "MORTGAGE30US": 6.87, "MORTGAGE15US": 6.15,
    "FEDFUNDS": 5.33, "DPRIME": 8.50, "SOFR": 5.30
}

async def fetch_fred_rate(series_id: str) -> float:
    cached = get_cached(f"fred_{series_id}", 10800)
    if cached is not None:
        return cached
    try:
        params = {
            "series_id": series_id, "api_key": FRED_API_KEY,
            "sort_order": "desc", "limit": 1, "file_type": "json"
        }
        async with httpx.AsyncClient(timeout=8.0) as c:
            resp = await c.get("https://api.stlouisfed.org/fred/series/observations", params=params)
            if resp.status_code == 200:
                obs = resp.json().get("observations", [])
                if obs and obs[0]["value"] != ".":
                    val = float(obs[0]["value"])
                    set_cached(f"fred_{series_id}", val)
                    return val
    except Exception as e:
        logger.warning(f"FRED error {series_id}: {e}")
    return FRED_FALLBACK.get(series_id, 0.0)

async def fetch_finnhub_quote(symbol: str) -> dict:
    cached = get_cached(f"fh_{symbol}", 300)
    if cached is not None:
        return cached
    if not finnhub_client:
        return {}
    try:
        loop = asyncio.get_event_loop()
        quote = await loop.run_in_executor(executor, finnhub_client.quote, symbol)
        if quote and quote.get('c', 0) > 0:
            set_cached(f"fh_{symbol}", quote)
            return quote
    except Exception as e:
        logger.warning(f"Finnhub error {symbol}: {e}")
    return {}

@api_router.get("/market/ticker")
async def get_market_ticker():
    results = await asyncio.gather(
        fetch_fred_rate("MORTGAGE30US"), fetch_fred_rate("MORTGAGE15US"),
        fetch_fred_rate("FEDFUNDS"), fetch_fred_rate("DPRIME"), fetch_fred_rate("SOFR"),
        fetch_finnhub_quote("SPY"), fetch_finnhub_quote("QQQ"), fetch_finnhub_quote("DIA"),
        return_exceptions=True
    )
    def sf(v, d=0.0): return v if isinstance(v, (int, float)) else d
    items = [
        {"label": "30yr Fixed", "value": f"{sf(results[0], 6.87):.2f}%", "type": "rate"},
        {"label": "15yr Fixed", "value": f"{sf(results[1], 6.15):.2f}%", "type": "rate"},
        {"label": "Fed Funds", "value": f"{sf(results[2], 5.33):.2f}%", "type": "rate"},
        {"label": "Prime Rate", "value": f"{sf(results[3], 8.50):.2f}%", "type": "rate"},
        {"label": "SOFR", "value": f"{sf(results[4], 5.30):.2f}%", "type": "rate"},
    ]
    for i, (sym, lbl) in enumerate([(None, None), (None, None), (None, None), (None, None), (None, None), ("SPY", "S&P 500"), ("QQQ", "NASDAQ"), ("DIA", "DOW ETF")]):
        if sym is None:
            continue
        q = results[i]
        if isinstance(q, dict) and q.get('c', 0) > 0:
            cp = q.get('dp', 0)
            items.append({"label": lbl, "value": f"${q['c']:,.2f}", "change": f"{cp:+.2f}%", "type": "stock", "positive": cp >= 0})
    return {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}

@api_router.get("/market/rates")
async def get_market_rates():
    results = await asyncio.gather(
        fetch_fred_rate("MORTGAGE30US"), fetch_fred_rate("MORTGAGE15US"),
        fetch_fred_rate("FEDFUNDS"), fetch_fred_rate("DPRIME"), fetch_fred_rate("SOFR"),
        fetch_finnhub_quote("SPY"), fetch_finnhub_quote("QQQ"), fetch_finnhub_quote("DIA"),
        return_exceptions=True
    )
    def sf(v, d=0.0): return v if isinstance(v, (int, float)) else d
    def sq(q, fb): return q if isinstance(q, dict) and q.get('c', 0) > 0 else fb
    return {
        "rates": {
            "mortgage_30y": sf(results[0], 6.87), "mortgage_15y": sf(results[1], 6.15),
            "fed_funds": sf(results[2], 5.33), "prime": sf(results[3], 8.50), "sofr": sf(results[4], 5.30),
        },
        "stocks": {
            "spy": sq(results[5], {"c": 521.45, "dp": 0.45, "d": 2.34, "h": 524.0, "l": 518.0, "pc": 519.11}),
            "qqq": sq(results[6], {"c": 441.23, "dp": 0.62, "d": 2.71, "h": 443.0, "l": 438.0, "pc": 438.52}),
            "dia": sq(results[7], {"c": 392.12, "dp": 0.31, "d": 1.21, "h": 393.5, "l": 390.0, "pc": 390.91}),
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/blog/articles")
async def get_articles(category: Optional[str] = None):
    query = {} if not category else {"category": category}
    articles = await db.blog_articles.find(query, {"_id": 0, "content": 0}).to_list(100)
    return {"articles": articles}

@api_router.get("/blog/articles/{slug}")
async def get_article(slug: str):
    article = await db.blog_articles.find_one({"slug": slug}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: dict):
    email = data.get("email", "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    existing = await db.newsletter_subs.find_one({"email": email})
    if existing:
        return {"message": "Already subscribed!", "success": True}
    await db.newsletter_subs.insert_one({"email": email, "subscribed_at": datetime.now(timezone.utc).isoformat()})
    return {"message": "Subscribed successfully!", "success": True}

app.include_router(api_router)

HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/a7387564404e56dc2465334c86a6584ef63a96bc7d21440c169cb0c955af4481.png"
HOUSE_IMG = "https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/1b3abe9e22d6e36dff960d0aca8eca90fbfc2ff7fdea957393556ec919531502.png"
CAR_IMG = "https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/cf4b773c3168c5b35c2f790577a3ff5e5f7ec376dda095e58db0e625cc519e09.png"
WEALTH_IMG = "https://static.prod-images.emergentagent.com/jobs/ac121a72-35fc-4b3b-a742-3d3e8767089c/images/d8b422f2475bcd5070ee963ea03ed1e837f5d38703e10a86927b5b9b56d1e48e.png"
MARKET_IMG = "https://images.pexels.com/photos/10628030/pexels-photo-10628030.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
CHART_IMG = "https://images.unsplash.com/photo-1643962577481-4ff81600e439?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHw0fHxzdG9jayUyMG1hcmtldCUyMHRyYWRpbmclMjBzY3JlZW4lMjBkYXJrfGVufDB8fHx8MTc3NTc1NTMwOXww&ixlib=rb-4.1.0&q=85"

BLOG_ARTICLES = [
    {
        "id": str(uuid.uuid4()), "slug": "rent-vs-buy-2026",
        "title": "Is It Better to Rent or Buy a Home in 2026?",
        "excerpt": "With mortgage rates above 6% and home prices at record highs, the rent vs buy debate has never been more critical. We break down the numbers.",
        "category": "Housing", "author": "FigureMyMoney Team", "published_date": "2026-02-10",
        "read_time": 8, "image_url": HOUSE_IMG, "tags": ["housing", "rent", "mortgage", "real-estate"],
        "content": "<p>One of the most consequential financial decisions you can make is whether to rent or buy a home. In 2026, with 30-year fixed mortgage rates around 6.5–7%, this decision requires careful analysis.</p><h2>The True Cost of Buying</h2><p>Most people only think about the mortgage payment. But homeownership also includes property taxes (1–2% annually), insurance, HOA fees, and maintenance (1–3% of home value per year).</p><h2>The Hidden Wealth of Renting</h2><p>Renting gets unfairly labeled as 'throwing money away.' But your down payment stays invested. $100,000 growing at 10% annually becomes $259,374 in 10 years.</p><h2>Break-Even Analysis</h2><p>Most markets in 2026 require 5–8 years before buying makes more financial sense than renting, due to upfront transaction costs and mortgage interest front-loading.</p><h2>When Buying Wins</h2><ul><li>Planning to stay 7+ years</li><li>Stable income and job security</li><li>Favorable rent-to-price ratio markets</li></ul><h2>When Renting Wins</h2><ul><li>Moving within 5 years</li><li>High-cost markets (SF, NYC, LA)</li><li>Market uncertainty or price inflation</li></ul><p>Use our <a href='/calculators/rent-vs-buy'>Rent vs Buy Calculator</a> for a personalized recommendation.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "car-lease-vs-buy-2026",
        "title": "Car Lease vs Buy: A Complete Financial Breakdown for 2026",
        "excerpt": "Auto loan rates are near 7-8% and lease terms have shifted. Here's what the math actually says about leasing vs financing your next vehicle.",
        "category": "Lifestyle", "author": "FigureMyMoney Team", "published_date": "2026-01-28",
        "read_time": 6, "image_url": CAR_IMG, "tags": ["car", "lease", "auto-loan", "lifestyle"],
        "content": "<p>The car-buying decision has never been more complex. With auto loan rates at 7–8% and manufacturers offering aggressive lease incentives, the financial calculus depends on your situation.</p><h2>The Case for Leasing</h2><p>Leasing means lower monthly payments. On a $45,000 SUV, you might pay $550/month to lease vs $750/month to finance — saving $7,200 over 3 years.</p><h2>The Hidden Costs of Leasing</h2><ul><li>Mileage limits (10,000–15,000/year, $0.15–$0.30 overage)</li><li>Wear and tear fees at lease end</li><li>Perpetual payments, zero equity building</li></ul><h2>Who Should Buy?</h2><ul><li>High-mileage drivers (15,000+ miles/year)</li><li>Those keeping cars 7+ years</li><li>Buyers prioritizing long-term cost over monthly payment</li></ul><p>Use our <a href='/calculators/car-lease'>Car Lease vs Buy Calculator</a> for your specific numbers.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "how-much-to-retire-2026",
        "title": "How Much Do You Need to Retire? The Definitive 2026 Guide",
        "excerpt": "The 4% rule, Social Security, inflation — here's a data-driven look at how much you actually need to retire comfortably in 2026.",
        "category": "Wealth", "author": "FigureMyMoney Team", "published_date": "2026-02-05",
        "read_time": 10, "image_url": WEALTH_IMG, "tags": ["retirement", "investing", "wealth"],
        "content": "<p>The retirement savings question has a well-known rule of thumb: save 25x your annual expenses. In 2026, the answer is more nuanced.</p><h2>The 4% Rule</h2><p>The 4% rule states you can withdraw 4% of your portfolio annually with a very high probability of not running out over 30 years. To generate $80,000/year, you'd need <strong>$2,000,000</strong> saved.</p><h2>Savings Benchmarks by Age</h2><ul><li>Age 30: 1x annual salary</li><li>Age 40: 3x annual salary</li><li>Age 50: 6x annual salary</li><li>Age 60: 8x annual salary</li></ul><h2>The Power of Compound Growth</h2><p>$500/month invested from age 25 at 8% return grows to <strong>$1.75 million by 65</strong>. Starting at 35 yields only $745,000 — less than half.</p><p>Use our <a href='/calculators/retirement'>Retirement Projection Calculator</a> for a personalized estimate.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "debt-payoff-avalanche-snowball",
        "title": "How to Pay Off Debt Fast: Avalanche vs Snowball Method",
        "excerpt": "High-interest debt is the biggest wealth killer. The avalanche method saves you thousands — here's how to choose the right strategy.",
        "category": "Wealth", "author": "FigureMyMoney Team", "published_date": "2026-01-20",
        "read_time": 7, "image_url": CHART_IMG, "tags": ["debt", "payoff", "personal-finance"],
        "content": "<p>Americans carry an average of $96,000 in debt per household. The method you use to pay it off can mean thousands of dollars in savings.</p><h2>The Avalanche Method</h2><p>Prioritize the <strong>highest interest rate debt first</strong>. Make minimums on all others, throw extra money at the highest rate. Mathematically optimal.</p><h2>The Snowball Method</h2><p>Pay off <strong>the smallest balance first</strong>. Generates psychological wins and momentum. Dave Ramsey's approach.</p><h2>The Numbers</h2><p>On three debts ($8k at 20%, $3k at 15%, $5k at 8%):<br/>Avalanche: ~$3,200 total interest | Snowball: ~$4,100 total interest</p><h2>Extra Payments Power</h2><p>On a $20,000 loan at 18% APR, adding just $200/month extra reduces payoff from 57 months to 28 months, saving over $7,000 in interest.</p><p>Use our <a href='/calculators/debt-payoff'>Debt Payoff Calculator</a> to see your savings.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "index-funds-vs-real-estate-2026",
        "title": "Index Funds vs Real Estate: Where Should You Invest $100k?",
        "excerpt": "Both have created generational wealth. When you run the numbers — liquidity, leverage, returns, effort — which wins for the average investor in 2026?",
        "category": "Wealth", "author": "FigureMyMoney Team", "published_date": "2026-02-15",
        "read_time": 9, "image_url": MARKET_IMG, "tags": ["investing", "real-estate", "index-funds"],
        "content": "<p>The debate between index funds and real estate has raged for decades. Both approaches have produced millionaires. The data tells an interesting story.</p><h2>Historical Returns</h2><ul><li>S&P 500 (1970–2025): ~10.7% average annual return</li><li>US Residential Real Estate: ~4–6% annual appreciation</li><li>Real Estate with 5x leverage: Effectively 20–30% return on equity in strong markets</li></ul><h2>The Leverage Advantage of Real Estate</h2><p>Put $100,000 down on a $500,000 property. A 5% appreciation gives you $25,000 on a $100,000 investment — a 25% return.</p><h2>The Simplicity Advantage of Index Funds</h2><p>Index funds require zero management. Real estate requires finding properties, tenants, repairs, vacancies, and legal complexities.</p><h2>The Winner</h2><p>For most investors: index funds win on simplicity and diversification. For those willing to learn real estate, leverage can amplify returns dramatically. The ideal portfolio includes both.</p><p>Use our <a href='/calculators/stock-returns'>Investment Returns Calculator</a> to model scenarios.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "fed-rate-decisions-mortgage-2026",
        "title": "What Federal Reserve Rate Decisions Mean for Your Mortgage",
        "excerpt": "The Fed raised rates aggressively in 2022–2023. Now as rates stabilize, here's exactly how Fed policy translates to your mortgage payment.",
        "category": "Housing", "author": "FigureMyMoney Team", "published_date": "2026-01-15",
        "read_time": 6, "image_url": HERO_IMG, "tags": ["mortgage", "fed-rate", "interest-rates"],
        "content": "<p>The Federal Reserve's rate decisions ripple through the entire economy — and your mortgage is directly in the path.</p><h2>How the Fed Rate Affects Mortgages</h2><p>The Fed Funds rate doesn't directly set mortgage rates. Instead, 30-year fixed rates track the 10-year Treasury yield. The typical spread has historically been 1.5–2%.</p><h2>The Rate-Payment Relationship</h2><p>On a $400,000 mortgage:<br/>At 3.0%: $1,686/month<br/>At 5.0%: $2,147/month<br/>At 7.0%: $2,661/month<br/>At 8.0%: $2,935/month</p><h2>Should You Wait for Rates to Drop?</h2><p>The 'date the rate, marry the house' strategy has merit if you find the right home. Refinancing costs 2–5% of the loan amount, so rates need to drop at least 0.75–1% to make refinancing worthwhile.</p><p>Use our <a href='/calculators/mortgage'>Mortgage Calculator</a> to understand different rate scenarios.</p>"
    }
]

@app.on_event("startup")
async def seed_blog_articles():
    count = await db.blog_articles.count_documents({})
    if count == 0:
        await db.blog_articles.insert_many([dict(a) for a in BLOG_ARTICLES])
        logger.info(f"Seeded {len(BLOG_ARTICLES)} blog articles")

@app.on_event("shutdown")
async def shutdown_db_client():
    db_client.close()
