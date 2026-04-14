from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List, Any
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
import hashlib
import hmac
import base64
import json
import secrets
from urllib.parse import quote

try:
    import finnhub
    FINNHUB_AVAILABLE = True
except ImportError:
    FINNHUB_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = (os.environ.get('MONGO_URL') or '').strip()
db_name = (os.environ.get('DB_NAME') or '').strip()
db_client = None
db = None

if mongo_url and db_name:
    try:
        db_client = AsyncIOMotorClient(mongo_url)
        db = db_client[db_name]
    except Exception as e:
        logger.warning(
            "MongoDB configuration is invalid; database-backed routes will use fallbacks where possible. Error: %s",
            e,
        )
elif mongo_url or db_name:
    logger.warning("MongoDB configuration is incomplete; database-backed routes will use fallbacks where possible.")
else:
    logger.warning("MongoDB is not configured; database-backed routes will use fallbacks where possible.")

FINNHUB_API_KEY = (os.environ.get('FINNHUB_API_KEY', '') or '').strip()
FRED_API_KEY = (os.environ.get('FRED_API_KEY', '') or '').strip()

finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY) if (FINNHUB_AVAILABLE and FINNHUB_API_KEY) else None
executor = ThreadPoolExecutor(max_workers=4)

_cache: dict = {}
_missing_config_warnings: set[str] = set()

def get_cached(key: str, ttl: int):
    if key in _cache:
        value, ts = _cache[key]
        if time.time() - ts < ttl:
            return value
    return None

def set_cached(key: str, value):
    _cache[key] = (value, time.time())

def warn_once(key: str, message: str) -> None:
    if key not in _missing_config_warnings:
        logger.warning(message)
        _missing_config_warnings.add(key)

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
    "FEDFUNDS": 5.33, "DPRIME": 8.50, "SOFR": 5.30,
    "MSPUS": 405300.0, "HOUST": 1487.0,
}

CITY_HPI_SERIES = [
    ("New York", "NYXRNSA"),
    ("Los Angeles", "LXXRNSA"),
    ("Chicago", "CHXRNSA"),
    ("Dallas", "DAXRNSA"),
    ("Miami", "MIXRNSA"),
    ("Atlanta", "ATXRNSA"),
    ("Boston", "BOXRNSA"),
    ("Charlotte", "CRXRNSA"),
    ("Cleveland", "CEXRNSA"),
    ("Denver", "DNXRNSA"),
    ("Detroit", "DEXRNSA"),
    ("Las Vegas", "LVXRNSA"),
    ("Minneapolis", "MNXRNSA"),
    ("Phoenix", "PHXRNSA"),
    ("Portland", "POXRNSA"),
    ("San Diego", "SDXRNSA"),
    ("San Francisco", "SFXRNSA"),
    ("Seattle", "SEXRNSA"),
    ("Tampa", "TPXRNSA"),
    ("Washington DC", "WDXRNSA"),
]

async def fetch_fred_rate(series_id: str) -> float:
    cached = get_cached(f"fred_{series_id}", 10800)
    if cached is not None:
        return cached
    if not FRED_API_KEY:
        warn_once("fred_missing", "FRED_API_KEY is missing; using fallback market rate data where available.")
        fallback = FRED_FALLBACK.get(series_id, 0.0)
        set_cached(f"fred_{series_id}", fallback)
        return fallback
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
    fallback = FRED_FALLBACK.get(series_id, 0.0)
    set_cached(f"fred_{series_id}", fallback)
    return fallback

async def fetch_fred_hpi_with_yoy(series_id: str) -> dict:
    """Fetch housing price index + YoY change (uses last 16 obs for ~12-month comparison)."""
    cache_key = f"fred_hpi_{series_id}"
    cached = get_cached(cache_key, 10800)
    if cached is not None:
        return cached
    if not FRED_API_KEY:
        warn_once("fred_hpi_missing", "FRED_API_KEY is missing; housing HPI live data is unavailable, using fallbacks where defined.")
        result = {"value": None, "yoy": None, "date": None}
        set_cached(cache_key, result)
        return result
    try:
        params = {
            "series_id": series_id, "api_key": FRED_API_KEY,
            "sort_order": "desc", "limit": 16, "file_type": "json"
        }
        async with httpx.AsyncClient(timeout=8.0) as c:
            resp = await c.get("https://api.stlouisfed.org/fred/series/observations", params=params)
            if resp.status_code == 200:
                obs = [o for o in resp.json().get("observations", []) if o["value"] != "."]
                if obs:
                    latest = float(obs[0]["value"])
                    yoy = None
                    if len(obs) >= 13:
                        prev = float(obs[12]["value"])
                        yoy = round((latest - prev) / prev * 100, 2) if prev else None
                    result = {"value": round(latest, 1), "yoy": yoy, "date": obs[0]["date"]}
                    set_cached(cache_key, result)
                    return result
    except Exception as e:
        logger.warning(f"FRED HPI error {series_id}: {e}")
    result = {"value": None, "yoy": None, "date": None}
    set_cached(cache_key, result)
    return result

async def fetch_finnhub_quote(symbol: str) -> dict:
    cached = get_cached(f"fh_{symbol}", 300)
    if cached is not None:
        return cached
    if not finnhub_client:
        warn_once("finnhub_missing", "FINNHUB_API_KEY is missing or the Finnhub client is unavailable; using ETF fallbacks where defined.")
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
        fetch_finnhub_quote("VNQ"), fetch_finnhub_quote("IWM"),
        fetch_finnhub_quote("TLT"), fetch_finnhub_quote("GLD"),
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
            "spy": sq(results[5], {"c": 521.45, "dp": 0.45, "d": 2.34, "h": 524.0, "l": 518.0, "o": 519.0, "pc": 519.11}),
            "qqq": sq(results[6], {"c": 441.23, "dp": 0.62, "d": 2.71, "h": 443.0, "l": 438.0, "o": 438.0, "pc": 438.52}),
            "dia": sq(results[7], {"c": 392.12, "dp": 0.31, "d": 1.21, "h": 393.5, "l": 390.0, "o": 390.0, "pc": 390.91}),
            "vnq": sq(results[8], {"c": 85.50, "dp": 0.20, "d": 0.17, "h": 86.0, "l": 85.0, "o": 85.0, "pc": 85.33}),
            "iwm": sq(results[9], {"c": 198.40, "dp": 0.35, "d": 0.69, "h": 199.0, "l": 197.5, "o": 197.5, "pc": 197.71}),
            "tlt": sq(results[10], {"c": 86.20, "dp": -0.12, "d": -0.10, "h": 86.8, "l": 85.9, "o": 86.3, "pc": 86.30}),
            "gld": sq(results[11], {"c": 225.40, "dp": 0.55, "d": 1.24, "h": 226.0, "l": 224.5, "o": 224.5, "pc": 224.16}),
        },
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/market/housing")
async def get_housing_data():
    cached = get_cached("housing_all", 10800)
    if cached:
        return cached
    national_tasks = [
        fetch_fred_hpi_with_yoy("CSUSHPINSA"),
        fetch_fred_rate("MSPUS"),
        fetch_fred_rate("HOUST"),
    ]
    city_tasks = [fetch_fred_hpi_with_yoy(series_id) for _, series_id in CITY_HPI_SERIES]
    all_results = await asyncio.gather(*national_tasks, *city_tasks, return_exceptions=True)
    def sr(v, d): return v if isinstance(v, (int, float)) else d
    def sh(v, d): return v if isinstance(v, dict) and v.get("value") else d
    national_hpi = sh(all_results[0], {"value": 326.6, "yoy": 0.9, "date": "2026-01-01"})
    cities = {}
    for i, (city_name, _) in enumerate(CITY_HPI_SERIES):
        r = all_results[3 + i]
        cities[city_name] = r if isinstance(r, dict) and r.get("value") else {"value": None, "yoy": None, "date": None}
    result = {
        "national": {
            "hpi": national_hpi,
            "median_price": sr(all_results[1], 405300),
            "housing_starts": sr(all_results[2], 1487),
        },
        "cities": cities,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    set_cached("housing_all", result)
    return result

def get_fallback_articles(category: Optional[str] = None, include_content: bool = False) -> List[dict]:
    articles = []
    for article in BLOG_ARTICLES + V3_BLOG_ARTICLES:
        if category and article.get("category") != category:
            continue
        item = dict(article)
        if not include_content:
            item.pop("content", None)
        articles.append(item)
    return sorted(articles, key=lambda item: item.get("published_date", ""), reverse=True)


def get_fallback_article(slug: str) -> Optional[dict]:
    for article in BLOG_ARTICLES + V3_BLOG_ARTICLES:
        if article.get("slug") == slug:
            return dict(article)
    return None


@api_router.get("/blog/articles")
async def get_articles(category: Optional[str] = None):
    if db is None:
        return {"articles": get_fallback_articles(category=category, include_content=False)}
    try:
        query = {} if not category else {"category": category}
        articles = await db.blog_articles.find(query, {"_id": 0, "content": 0}).to_list(100)
        return {"articles": articles}
    except Exception as e:
        logger.warning(f"Blog list fallback triggered: {e}")
        return {"articles": get_fallback_articles(category=category, include_content=False)}

@api_router.get("/blog/articles/{slug}")
async def get_article(slug: str):
    if db is None:
        article = get_fallback_article(slug)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        return article
    try:
        article = await db.blog_articles.find_one({"slug": slug}, {"_id": 0})
    except Exception as e:
        logger.warning(f"Blog article fallback triggered for {slug}: {e}")
        article = get_fallback_article(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: dict):
    email = data.get("email", "").strip().lower()
    source = (str(data.get("source") or "footer").strip().lower() or "footer")[:50]
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    try:
        result = await _subscribe_newsletter_contact(email, source=source)
        status = result.get("status")
        if status == "created":
            message = "Subscribed successfully!"
        elif status == "updated":
            message = "Welcome back — your subscription is active."
        else:
            message = "You're already subscribed!"
        return {"message": message, "success": True}
    except ValueError as e:
        logger.error("Newsletter subscribe failed for %s: %s", email, e)
        if "not configured" in str(e).lower():
            raise HTTPException(status_code=503, detail="Newsletter service temporarily unavailable")
        raise HTTPException(status_code=500, detail="Unable to save your subscription right now. Please try again.")
    except Exception as e:
        logger.error("Newsletter subscribe failed for %s: %s", email, e)
        raise HTTPException(status_code=500, detail="Unable to save your subscription right now. Please try again.")

# ─── Trading Engine ────────────────────────────────────────────────────────────

SCANNER_UNIVERSE = [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'JPM', 'V', 'XOM',
    'UNH', 'JNJ', 'PG', 'MA', 'HD', 'BAC', 'ABBV', 'MRK', 'LLY', 'KO',
    'AVGO', 'COST', 'WMT', 'CSCO', 'MCD', 'CRM', 'NFLX', 'ADBE', 'AMD', 'QCOM',
]

def build_indicators_from_quote(quote: dict) -> dict:
    entry_price = float(quote.get('c') or 0)
    if not entry_price:
        raise ValueError('Invalid quote price')
    prev_close = float(quote.get('pc') or entry_price)
    high = float(quote.get('h') or entry_price * 1.01)
    low = float(quote.get('l') or entry_price * 0.99)
    open_p = float(quote.get('o') or prev_close)
    change_pct = float(quote.get('dp') or 0)
    intraday_pct = ((entry_price - open_p) / open_p * 100) if open_p else change_pct
    range_pct = (entry_price - low) / (high - low) if high > low else 0.5
    day_range_pct = ((high - low) / entry_price * 100) if entry_price else 1.2
    trend_bias = change_pct * 0.65 + intraday_pct * 0.35
    rsi = round(max(15.0, min(85.0, 38 + range_pct * 26 + trend_bias * 1.9)), 1)
    macd_hist = round(trend_bias * 0.03 + (range_pct - 0.5) * 0.08, 4)
    bb_pct = round(max(0.08, min(0.92, 0.2 + range_pct * 0.6 + trend_bias / 18)), 3)
    stoch_k = round(max(0.0, min(100.0, range_pct * 100 + intraday_pct * 2)), 1)
    atr = max(high - low, entry_price * max(0.008, day_range_pct / 100))
    hv = round(abs(change_pct) * 10 + day_range_pct * 6 + 12, 1)
    vol_ratio = round(max(0.75, min(2.8, 0.85 + abs(change_pct) * 0.22 + day_range_pct * 0.18)), 2)
    sma50 = round(entry_price / max(1e-9, 1 + trend_bias / 220), 2)
    sma200 = round(entry_price / max(1e-9, 1 + trend_bias / 420), 2)
    above50 = entry_price >= sma50
    above200 = entry_price >= sma200
    adx = round(18 + abs(rsi - 50) * 0.55 + abs(trend_bias) * 1.5)
    trend_strength = 'STRONG' if abs(trend_bias) > 2 else ('MODERATE' if abs(trend_bias) > 0.75 else 'WEAK')
    return {
        'rsi': rsi, 'macdHist': macd_hist, 'bbPct': bb_pct, 'stochK': stoch_k,
        'atr': round(atr, 4), 'volRatio': vol_ratio,
        'atrPct': round(atr / entry_price * 100, 2),
        'sma50': sma50, 'sma200': sma200, 'above50': above50, 'above200': above200,
        'goldenCross': above50 and above200 and trend_bias > 0.9 and range_pct > 0.55,
        'deathCross': not above50 and not above200 and trend_bias < -0.9 and range_pct < 0.45,
        'ivPct': hv, 'ivRank': min(80, abs(change_pct) * 8 + day_range_pct * 4 + 10),
        'adx': adx, 'trendStrength': trend_strength, 'dataMode': 'QUOTE ONLY',
    }

def score_signal(inds: dict, strategy: str = 'momentum') -> dict:
    bull, bear, reasons = 0.0, 0.0, []
    rsi = inds.get('rsi', 50)
    macd_hist = inds.get('macdHist', 0)
    bb_pct = inds.get('bbPct', 0.5)
    stoch_k = inds.get('stochK', 50)
    vol_ratio = inds.get('volRatio', 1)
    atr_pct = inds.get('atrPct', 1.5)
    above50 = inds.get('above50', True)
    sma50 = inds.get('sma50', 0)
    sma200 = inds.get('sma200', 0)
    iv_rank = inds.get('ivRank', 30)
    iv_pct = inds.get('ivPct', 20)
    golden = inds.get('goldenCross', False)
    death = inds.get('deathCross', False)

    if strategy == 'momentum':
        if 50 < rsi < 70:
            bull += 25; reasons.append(f"RSI {rsi} in bullish momentum zone")
        elif 30 < rsi < 45:
            bear += 20; reasons.append(f"RSI {rsi} showing bearish momentum")
        elif rsi >= 70:
            bull += 8; reasons.append(f"RSI {rsi} overbought — upside momentum with tighter risk")
        elif rsi <= 30:
            bear += 8; reasons.append(f"RSI {rsi} oversold — trend pressure elevated")
        if macd_hist > 0.01:
            bull += 25; reasons.append(f"MACD histogram +{macd_hist:.3f} confirms bullish momentum")
        elif macd_hist < -0.01:
            bear += 25; reasons.append(f"MACD histogram {macd_hist:.3f} confirms bearish momentum")
        if golden:
            bull += 20; reasons.append(f"Price above 50-SMA ({sma50}) and 200-SMA ({sma200})")
        elif death:
            bear += 20; reasons.append(f"Price below 50-SMA ({sma50}) and 200-SMA ({sma200})")
        elif above50:
            bull += 10; reasons.append(f"Price holding above 50-SMA ({sma50})")
        else:
            bear += 10; reasons.append(f"Price trading below 50-SMA ({sma50})")
        if vol_ratio > 1.5:
            bull += 12; reasons.append(f"Volume {vol_ratio}x 20-day average confirms the move")

    elif strategy == 'mean_reversion':
        if rsi <= 30:
            bull += 40; reasons.append(f"RSI {rsi} signals extreme oversold conditions")
        elif rsi >= 70:
            bear += 40; reasons.append(f"RSI {rsi} signals extreme overbought conditions")
        if bb_pct <= 0.1:
            bull += 35; reasons.append(f"BB%B {bb_pct} shows price near the lower Bollinger band")
        elif bb_pct >= 0.9:
            bear += 35; reasons.append(f"BB%B {bb_pct} shows price near the upper Bollinger band")
        if stoch_k < 20:
            bull += 20; reasons.append(f"Stochastic K {stoch_k} supports a reversal bounce setup")
        elif stoch_k > 80:
            bear += 20; reasons.append(f"Stochastic K {stoch_k} supports a downside reversal setup")

    elif strategy == 'breakout':
        if vol_ratio > 2 and rsi > 55:
            bull += 45; reasons.append(f"Volume surge ({vol_ratio}x) plus RSI {rsi} supports breakout continuation")
        elif vol_ratio > 2 and rsi < 45:
            bear += 45; reasons.append(f"High-volume breakdown ({vol_ratio}x) with RSI {rsi}")
        if atr_pct > 2:
            bull += 8; bear += 8; reasons.append(f"ATR {atr_pct}% shows volatility expansion")
        if above50 and macd_hist > 0:
            bull += 25; reasons.append("Price above trend support with positive MACD confirmation")
        elif not above50 and macd_hist < 0:
            bear += 25; reasons.append("Price below trend support with negative MACD confirmation")

    elif strategy == 'volatility':
        if iv_rank > 50:
            bull += 20; bear += 20
            reasons.append(f"Historical volatility proxy {iv_pct}% favors premium-selling structures")
        else:
            if macd_hist > 0:
                bull += 30; reasons.append("Lower volatility with positive MACD favors directional upside exposure")
            else:
                bear += 30; reasons.append("Lower volatility with negative MACD favors directional downside exposure")
        if vol_ratio > 1.8:
            reasons.append(f"Volume spike {vol_ratio}x suggests volatility expansion risk")

    if inds.get('dataMode') == 'QUOTE ONLY':
        qt = max(-12.0, min(12.0,
            (rsi - 50) * 0.18 + macd_hist * 140 + (bb_pct - 0.5) * 12
            + (stoch_k - 50) * 0.08 + (vol_ratio - 1) * 10))
        if qt > 0.25: bull += qt
        elif qt < -0.25: bear += abs(qt)

    net = bull - bear
    if abs(net) < 30:
        return {'action': 'HOLD', 'rawConfidence': min(65, 40 + abs(net)),
                'reasons': reasons or ['Signal strength did not exceed the trade threshold.'],
                'bullScore': round(bull, 1), 'bearScore': round(bear, 1)}
    if net > 0:
        return {'action': 'BUY', 'rawConfidence': min(95, 50 + bull * 0.55),
                'reasons': reasons, 'bullScore': round(bull, 1), 'bearScore': round(bear, 1)}
    return {'action': 'SELL', 'rawConfidence': min(95, 50 + bear * 0.55),
            'reasons': reasons, 'bullScore': round(bull, 1), 'bearScore': round(bear, 1)}

def rank_trading_signal(signal: dict) -> float:
    if str(signal.get('action', 'HOLD')).upper() == 'HOLD':
        return 0.0
    confidence = float(signal.get('confidence') or signal.get('rawConfidence') or 0)
    bd = signal.get('scoreBreakdown') or {}
    conviction_spread = abs(float(bd.get('bull', 0)) - float(bd.get('bear', 0)))
    inds = signal.get('indicators') or {}
    atr_pct = float(inds.get('atrPct', 1.5))
    vol_ratio = float(inds.get('volRatio', 1))
    adx = float(inds.get('adx', 20))
    ts = str(inds.get('trendStrength', '')).upper()
    dm = str(inds.get('dataMode', '')).upper()
    score = confidence
    score += min(18, conviction_spread * 0.25)
    score += min(10, max(0, vol_ratio - 1) * 8)
    score += max(0.0, min(9.0, 9 - abs(atr_pct - 2.5) * 3))
    score += min(8, max(0, adx - 20) * 0.35)
    if ts == 'STRONG': score += 5
    elif ts == 'MODERATE': score += 2.5
    if dm == 'CANDLES+QUOTE': score += 4
    elif dm == 'QUOTE ONLY': score -= 8
    return round(max(0.0, score), 1)

async def generate_trading_signal(symbol: str, strategy: str = 'momentum') -> dict:
    sym = symbol.strip().upper()
    quote = await fetch_finnhub_quote(sym)
    if not quote or not quote.get('c'):
        raise ValueError(f"Symbol '{sym}' not found or no market data available")
    entry_price = float(quote['c'])
    indicators = build_indicators_from_quote(quote)
    scored = score_signal(indicators, strategy)
    penalty = 8 if indicators['dataMode'] == 'QUOTE ONLY' else 0
    confidence = max(38 if scored['action'] == 'HOLD' else 45, scored['rawConfidence'] - penalty)
    atr = indicators['atr']
    stop_loss = entry_price + atr * 1.5 if scored['action'] == 'SELL' else entry_price - atr * 1.5
    target = entry_price - atr * 2 if scored['action'] == 'SELL' else entry_price + atr * 2
    return {
        'symbol': sym, 'strategy': strategy, 'action': scored['action'],
        'confidence': round(confidence), 'rawConfidence': round(confidence),
        'entryPrice': round(entry_price, 2), 'stopLoss': round(stop_loss, 2),
        'targetPrice': round(target, 2), 'indicators': indicators,
        'reasons': scored['reasons'],
        'profileName': f"{sym} · Live Analysis",
        'scoreBreakdown': {'bull': scored['bullScore'], 'bear': scored['bearScore']},
        'rankingScore': None,
    }

async def run_scanner(strategy: str = 'momentum') -> dict:
    generated_at = datetime.now(timezone.utc).isoformat()
    results = []
    failures = []
    sem = asyncio.Semaphore(8)

    async def scan_one(sym):
        async with sem:
            try:
                sig = await generate_trading_signal(sym, strategy)
                if sig['action'] != 'HOLD':
                    results.append({
                        'symbol': sig['symbol'], 'strategy': sig['strategy'],
                        'action': sig['action'], 'confidence': sig['confidence'],
                        'rankingScore': rank_trading_signal(sig),
                        'entryPrice': sig['entryPrice'], 'stopLoss': sig['stopLoss'],
                        'targetPrice': sig['targetPrice'], 'reasons': sig['reasons'],
                        'indicators': sig['indicators'],
                        'scoreBreakdown': sig['scoreBreakdown'],
                        'profileName': sig['profileName'], 'generatedAt': generated_at,
                    })
            except Exception as e:
                failures.append({'symbol': sym, 'error': str(e)})

    await asyncio.gather(*[scan_one(sym) for sym in SCANNER_UNIVERSE])
    ranked = sorted(results, key=lambda s: rank_trading_signal(s), reverse=True)
    top = ranked[:10]
    return {
        'generatedAt': generated_at, 'strategy': strategy,
        'scanned': len(SCANNER_UNIVERSE), 'signalCount': len(results),
        'topSignals': top, 'failures': len(failures), 'source': 'live',
    }

# ─── Supabase + Auth Helpers ──────────────────────────────────────────────────

SUPABASE_URL = (os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SESSION_SECRET = os.environ.get("TRADING_SESSION_SECRET", "fmm-trading-secret-change-in-prod")
SESSION_TTL_MS = 12 * 60 * 60 * 1000  # 12 hours

async def supabase_req(method: str, path: str, body: Any = None, params: str = "") -> Any:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Supabase not configured")
    url = f"{SUPABASE_URL}/rest/v1/{path}{'?' + params if params else ''}"
    headers: dict = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if method in ("POST", "PATCH") and body is not None:
        headers["Prefer"] = "return=representation"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.request(method, url, headers=headers, json=body)
        if not resp.is_success:
            raise ValueError(f"Supabase {resp.status_code}: {resp.text[:200]}")
        text = resp.text.strip()
        return resp.json() if text else None


def _supabase_auth_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def _auth_storage_config_error() -> str:
    return "Trading auth storage is not configured. Set SUPABASE_URL + SUPABASE_SERVICE_KEY or MONGO_URL + DB_NAME."


def _newsletter_storage_config_error() -> str:
    return "Newsletter subscription storage is not configured."


async def _subscribe_newsletter_contact(email: str, source: str = "footer") -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    safe_email = quote(email, safe="")
    last_error: Optional[Exception] = None

    if _supabase_auth_enabled():
        try:
            rows = await supabase_req(
                "GET",
                "subscribers",
                params=f"email=eq.{safe_email}&select=id,email,subscriber_state,source&limit=1",
            )
            if rows:
                subscriber = rows[0]
                patch_body = {"updated_at": timestamp}
                if subscriber.get("subscriber_state") != "active":
                    patch_body["subscriber_state"] = "active"
                if source and subscriber.get("source") != source:
                    patch_body["source"] = source
                if len(patch_body) > 1:
                    updated_rows = await supabase_req(
                        "PATCH",
                        "subscribers",
                        body=patch_body,
                        params=f"email=eq.{safe_email}",
                    )
                    return {"status": "updated", "subscriber": (updated_rows or [subscriber])[0]}
                return {"status": "existing", "subscriber": subscriber}

            inserted_rows = await supabase_req(
                "POST",
                "subscribers",
                body={
                    "email": email,
                    "subscriber_state": "active",
                    "source": source,
                    "created_at": timestamp,
                    "updated_at": timestamp,
                },
            )
            subscriber = inserted_rows[0] if inserted_rows else {
                "email": email,
                "subscriber_state": "active",
                "source": source,
            }
            return {"status": "created", "subscriber": subscriber}
        except Exception as e:
            last_error = e
            logger.warning("Supabase newsletter subscribe failed for %s; falling back to MongoDB. Error: %s", email, e)

    if db is not None:
        existing = await db.newsletter_subs.find_one({"email": email}, {"_id": 0})
        status = "existing"
        if existing:
            needs_update = existing.get("subscriber_state") != "active" or existing.get("source") != source
            if needs_update:
                status = "updated"
                await db.newsletter_subs.update_one(
                    {"email": email},
                    {"$set": {"subscriber_state": "active", "source": source, "updated_at": timestamp}},
                )
            return {"status": status, "subscriber": {**existing, "subscriber_state": "active", "source": source, "updated_at": timestamp}}

        subscriber_doc = {
            "email": email,
            "subscriber_state": "active",
            "source": source,
            "subscribed_at": timestamp,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        await db.newsletter_subs.insert_one(subscriber_doc)
        return {"status": "created", "subscriber": subscriber_doc}

    if last_error:
        raise ValueError(f"Newsletter subscription failed: {last_error}")
    raise ValueError(_newsletter_storage_config_error())


async def _mongo_find_trading_user(email: str) -> Optional[dict]:
    if db is None:
        return None
    return await db.trading_users.find_one({"email": email}, {"_id": 0})


async def _find_trading_user(email: str) -> Optional[dict]:
    last_error: Optional[Exception] = None
    if _supabase_auth_enabled():
        try:
            rows = await supabase_req(
                "GET",
                "trading_users",
                params=f"email=eq.{email}&select=id,email,display_name,password_hash,password_salt,role,status,last_login_at&limit=1",
            )
            if rows:
                return rows[0]
        except Exception as e:
            last_error = e
            logger.warning("Supabase auth lookup failed for %s; falling back to MongoDB. Error: %s", email, e)
    if db is not None:
        return await _mongo_find_trading_user(email)
    if last_error:
        raise ValueError(f"Trading auth lookup failed: {last_error}")
    raise ValueError(_auth_storage_config_error())


async def _create_trading_user(email: str, display_name: str, password_hash: str, password_salt: str) -> dict:
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "display_name": display_name,
        "password_hash": password_hash,
        "password_salt": password_salt,
        "role": "member",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login_at": None,
    }

    last_error: Optional[Exception] = None
    if _supabase_auth_enabled():
        try:
            rows = await supabase_req("POST", "trading_users", body={
                "email": email,
                "display_name": display_name,
                "password_hash": password_hash,
                "password_salt": password_salt,
                "role": "member",
                "status": "active",
            })
            if rows:
                return rows[0]
            return user_doc
        except Exception as e:
            last_error = e
            logger.warning("Supabase auth create failed for %s; falling back to MongoDB. Error: %s", email, e)

    if db is not None:
        await db.trading_users.insert_one(user_doc)
        return user_doc

    if last_error:
        raise ValueError(f"Trading auth create failed: {last_error}")
    raise ValueError(_auth_storage_config_error())


async def _touch_trading_last_login(user_id: str) -> None:
    timestamp = datetime.now(timezone.utc).isoformat()

    if _supabase_auth_enabled():
        try:
            await supabase_req(
                "PATCH",
                "trading_users",
                body={"last_login_at": timestamp},
                params=f"id=eq.{user_id}",
            )
            return
        except Exception as e:
            logger.warning("Supabase last_login update failed for %s; falling back to MongoDB. Error: %s", user_id, e)

    if db is not None:
        await db.trading_users.update_one({"id": user_id}, {"$set": {"last_login_at": timestamp}})

def _hash_password(password: str) -> dict:
    salt = secrets.token_hex(16)
    h = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64)
    return {"salt": salt, "hash": h.hex()}

def _verify_password(password: str, salt: str, expected: str) -> bool:
    try:
        derived = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64)
        return hmac.compare_digest(derived.hex(), expected)
    except Exception:
        return False

def _create_session_token(payload: dict) -> str:
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = hmac.new(SESSION_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"

def _verify_session_token(token: str) -> Optional[dict]:
    if not token or "." not in token:
        return None
    body, sig = token.rsplit(".", 1)
    expected = hmac.new(SESSION_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        padded = body + "=" * (-len(body) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded).decode())
        if not data.get("exp") or time.time() * 1000 > data["exp"]:
            return None
        return data
    except Exception:
        return None

def _get_session(authorization: Optional[str]) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return _verify_session_token(authorization[7:])

# ─── Trading API Routes ────────────────────────────────────────────────────────

class TradingRegisterRequest(BaseModel):
    email: str
    password: str
    displayName: str

class TradingLoginRequest(BaseModel):
    email: str
    password: str

class TradingAnalyzeRequest(BaseModel):
    symbol: str
    strategy: str = 'momentum'

@api_router.post("/trading/register")
async def trading_register(req: TradingRegisterRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if len(req.displayName.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full name.")
    logger.info("Trading registration requested for %s", email)
    try:
        existing = await _find_trading_user(email)
        if existing:
            raise HTTPException(status_code=409, detail="This email is already registered. Please sign in instead.", headers={"X-Code": "USER_EXISTS"})
        pw = _hash_password(req.password)
        await _create_trading_user(email, req.displayName.strip(), pw["hash"], pw["salt"])
        return {"ok": True, "user": {"email": email, "displayName": req.displayName.strip()}}
    except HTTPException:
        raise
    except ValueError as e:
        message = str(e)
        if "not configured" in message:
            raise HTTPException(status_code=503, detail=message)
        raise HTTPException(status_code=500, detail=message)
    except Exception as e:
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")

@api_router.post("/trading/login")
async def trading_login(req: TradingLoginRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    logger.info("Trading login requested for %s", email)
    try:
        user = await _find_trading_user(email)
        if not user or not _verify_password(req.password, user["password_salt"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        if user.get("status") != "active":
            raise HTTPException(status_code=403, detail="Account is not active. Please contact support.")
        token = _create_session_token({
            "sub": user["id"], "email": user["email"],
            "name": user.get("display_name", email),
            "role": user.get("role", "member"),
            "exp": int(time.time() * 1000) + SESSION_TTL_MS,
        })
        asyncio.create_task(_touch_trading_last_login(user["id"]))
        return {"ok": True, "token": token, "user": {
            "id": user["id"], "email": user["email"],
            "displayName": user.get("display_name", email), "role": user.get("role", "member"),
        }}
    except HTTPException:
        raise
    except ValueError as e:
        message = str(e)
        if "not configured" in message:
            raise HTTPException(status_code=503, detail=message)
        raise HTTPException(status_code=500, detail=message)
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")

@api_router.get("/trading/me")
async def trading_me(authorization: Optional[str] = Header(None)):
    session = _get_session(authorization)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {"ok": True, "user": {
        "id": session.get("sub"), "email": session.get("email"),
        "displayName": session.get("name"), "role": session.get("role", "member"),
    }}

@api_router.post("/trading/analyze")
async def trading_analyze(req: TradingAnalyzeRequest, authorization: Optional[str] = Header(None)):
    session = _get_session(authorization)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")
    valid_strategies = {'momentum', 'mean_reversion', 'breakout', 'volatility'}
    strategy = req.strategy if req.strategy in valid_strategies else 'momentum'
    try:
        result = await generate_trading_signal(req.symbol, strategy)
        if SUPABASE_URL and SUPABASE_SERVICE_KEY:
            asyncio.create_task(supabase_req("POST", "trading_signals", body={
                "symbol": result["symbol"], "strategy": result["strategy"],
                "action": result["action"], "entry_price": result["entryPrice"],
                "stop_loss": result["stopLoss"], "target_price": result["targetPrice"],
                "outcome": None,
            }))
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Trading analyze error: {e}")
        raise HTTPException(status_code=500, detail="Unable to analyze signal. Try again.")

@api_router.get("/trading/scan-results")
async def trading_scan_results(refresh: Optional[str] = None, authorization: Optional[str] = Header(None)):
    session = _get_session(authorization)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")
    force_refresh = refresh == '1'
    if not force_refresh:
        cached = get_cached("trading_scan", 28800)
        if cached:
            return {**cached, 'source': 'cached'}
        if db is not None:
            try:
                doc = await db.trading_daily_scan.find_one(
                    {"strategy": "momentum"}, {"_id": 0}, sort=[("generatedAt", -1)])
                if doc:
                    ts = doc.get('generatedAt', '')
                    try:
                        age = (datetime.now(timezone.utc) - datetime.fromisoformat(ts.replace('Z', '+00:00'))).total_seconds()
                        if age < 28800:
                            result = {k: v for k, v in doc.items() if k != '_id'}
                            set_cached("trading_scan", result)
                            return {**result, 'source': 'cached'}
                    except Exception:
                        pass
            except Exception as e:
                logger.warning(f"Unable to load persisted trading scan cache: {e}")
    try:
        result = await run_scanner('momentum')
        if db is not None:
            try:
                await db.trading_daily_scan.delete_many({"strategy": "momentum"})
                await db.trading_daily_scan.insert_one({**result})
            except Exception as e:
                logger.warning(f"Unable to persist trading scan cache: {e}")
        set_cached("trading_scan", result)
        return result
    except Exception as e:
        logger.error(f"Scanner error: {e}")
        raise HTTPException(status_code=500, detail="Scanner unavailable. Try again later.")

@api_router.get("/trading/signal-stats/{symbol}/{strategy}")
async def trading_signal_stats(symbol: str, strategy: str, authorization: Optional[str] = Header(None)):
    session = _get_session(authorization)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required.")
    try:
        rows = await supabase_req("GET", "trading_signals",
            params=f"symbol=eq.{symbol.upper()}&strategy=eq.{strategy}&order=created_at.desc&limit=50&select=entry_price,exit_price,outcome")
        decided = [r for r in (rows or []) if r.get("outcome") in ("WIN", "LOSS")]
        wins = sum(1 for r in decided if r.get("outcome") == "WIN")
        sample = len(decided)
        win_rate = round(wins / sample * 100, 1) if sample else None
        rets = [(r["exit_price"] - r["entry_price"]) / r["entry_price"] * 100
                for r in decided if r.get("entry_price") and r.get("exit_price")]
        avg_ret = round(sum(rets) / len(rets), 2) if rets else None
        return {"winRate": win_rate, "avgReturn": avg_ret, "sampleSize": sample}
    except ValueError:
        return {"winRate": None, "avgReturn": None, "sampleSize": 0}
    except Exception as e:
        logger.error(f"Signal stats error: {e}")
        raise HTTPException(status_code=500, detail="Unable to load signal stats.")

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

V3_BLOG_ARTICLES = [
    {
        "id": str(uuid.uuid4()), "slug": "2026-housing-market-outlook",
        "title": "2026 Housing Market Outlook: Mortgage Rates, Inventory, and Home Prices",
        "excerpt": "A practical 2026 housing market outlook covering mortgage rates, housing inventory, home prices, and what buyers and sellers should watch.",
        "category": "Housing", "author": "FigureMyMoney Team", "published_date": "2026-01-15",
        "read_time": 7, "image_url": HOUSE_IMG, "tags": ["housing", "mortgage", "real-estate", "market-outlook"],
        "content": "<p>The 2026 housing market is likely to remain a market of local stories instead of one national trend. In many metro areas, the core tension is still affordability: monthly payment pressure from mortgage rates is running into income growth that has not fully caught up.</p><h2>Mortgage Rates: The Swing Factor</h2><p>Mortgage rates remain the most important swing factor. Even small changes can materially shift monthly payment and debt-to-income ratios. For buyers, that means pre-approval should be treated as a moving target, not a one-time checkbox.</p><h2>Inventory Is Improving — From Low Baselines</h2><p>Inventory is improving in many cities but from low baselines. A balanced market does not require a flood of new listings, only enough incremental supply to reduce bidding pressure and improve time-on-market.</p><h2>The Move-In Ready Premium</h2><p>Buyers with limited cash buffers are paying premiums for certainty, while properties needing upgrades can linger and eventually reset in price. That dynamic creates opportunity for prepared buyers, but only if they underwrite renovation risk conservatively.</p><h2>The Right Question for 2026</h2><p>For households evaluating a purchase in 2026, the right question is not 'Is it a perfect market?' It is 'Does this home fit your time horizon, cash runway, and monthly payment resilience?'</p><p>Use our <a href='/calculators/rent-vs-buy'>Rent vs Buy Calculator</a> to model your specific scenario.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "stock-market-outlook-2026",
        "title": "Stock Market Outlook 2026: Fed Rates, Earnings Growth, and Valuations",
        "excerpt": "A grounded stock market outlook for 2026 based on Fed policy, corporate earnings, valuation risk, and portfolio positioning.",
        "category": "Wealth", "author": "FigureMyMoney Team", "published_date": "2026-02-24",
        "read_time": 8, "image_url": CHART_IMG, "tags": ["stocks", "investing", "fed-rate", "market"],
        "content": "<p>The 2026 equity environment is likely to remain valuation-sensitive. After periods of multiple expansion, markets become more dependent on actual earnings delivery. That shifts focus from macro headlines to margin durability, pricing power, and balance-sheet quality.</p><h2>Fed Policy: The Major Driver</h2><p>Fed policy remains a major driver of risk appetite. If inflation continues to normalize and policy rates stabilize, equities can benefit from lower volatility in discount rates. But if inflation proves sticky, long-duration growth assets may face renewed pressure.</p><h2>Earnings Breadth Matters</h2><p>A market led by a handful of mega-cap names can still deliver index performance, but it carries concentration risk. Broader participation across sectors usually signals healthier risk conditions.</p><h2>Portfolio Construction Edge</h2><p>For investors, the tactical edge is in portfolio construction rather than prediction. Blend quality growth with value and cash-flow resilience. Use rebalancing rules, not emotion, to reduce concentration after large run-ups.</p><p>Use our <a href='/calculators/stock-returns'>Investment Returns Calculator</a> to model your portfolio scenarios.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "fed-rate-cuts-2026-impact",
        "title": "Federal Reserve Rate Cuts in 2026: Impact on Real Estate and Stocks",
        "excerpt": "How potential Fed rate cuts in 2026 could influence mortgage rates, housing demand, stock valuations, and portfolio strategy.",
        "category": "Housing", "author": "FigureMyMoney Team", "published_date": "2026-03-27",
        "read_time": 6, "image_url": HERO_IMG, "tags": ["fed-rate", "housing", "stocks", "macro"],
        "content": "<p>Rate cuts are often interpreted as universally bullish, but context matters. Cuts driven by easing inflation with stable growth can support risk assets and housing affordability. Cuts driven by growth deterioration can produce mixed outcomes.</p><h2>Housing: The Transmission Mechanism</h2><p>Lower policy rates do not translate one-for-one to mortgage rates, but they can improve financing conditions and unlock sidelined demand. The practical effect is usually strongest in payment-sensitive markets where inventory is gradually improving.</p><h2>Equities: Multiples vs Earnings</h2><p>For equities, lower rates can support valuation multiples, especially for long-duration growth assets. But earnings quality still dominates medium-term outcomes. Investors should not ignore balance-sheet leverage, margin resilience, and sector-specific demand trends.</p><h2>Conditional Positioning</h2><p>A useful approach is conditional positioning: increase risk exposure when disinflation and earnings breadth improve together. Stay selective when cuts coincide with weakening labor data.</p><p>Use our <a href='/calculators/mortgage'>Mortgage Calculator</a> to model your payments at different rate scenarios.</p>"
    },
    {
        "id": str(uuid.uuid4()), "slug": "recession-proof-investing-2026",
        "title": "Recession-Proof Investing Strategy: Dividends, Cash, Bonds, and Growth",
        "excerpt": "A recession-ready investing framework that balances dividends, cash reserves, high-quality bonds, and selective growth exposure.",
        "category": "Wealth", "author": "FigureMyMoney Team", "published_date": "2026-04-02",
        "read_time": 7, "image_url": WEALTH_IMG, "tags": ["investing", "recession", "bonds", "dividends"],
        "content": "<p>No portfolio is truly recession-proof, but portfolios can be recession-resilient. The goal is not to avoid all drawdowns; it is to preserve decision-making flexibility so you are not forced into poor choices at the worst time.</p><h2>The Four-Sleeve Allocation</h2><p>A resilient allocation usually includes four sleeves: liquidity (cash and short duration), income (high-quality bonds and dividends), durable growth (companies with pricing power), and optional risk capital (higher-beta opportunities sized modestly).</p><h2>Cash Is Strategy, Not Waste</h2><p>Cash is often criticized for low return, but its strategic role is underappreciated. Adequate liquidity allows rebalancing into weakness and protects against forced selling. In uncertain cycles, optionality has real economic value.</p><h2>Quality Across Asset Classes</h2><p>In equities, prioritize balance-sheet strength and free-cash-flow durability. In fixed income, focus on credit quality and duration alignment with your rate outlook. The most reliable recession strategy is process discipline.</p><p>Use our <a href='/calculators/invest-vs-debt'>Invest vs Debt Calculator</a> to optimize your allocation decisions.</p>"
    },
]

@app.on_event("startup")
async def seed_blog_articles():
    if db is None:
        logger.info("Skipping blog seed because MongoDB is not configured")
        return
    try:
        existing_slugs = {doc['slug'] async for doc in db.blog_articles.find({}, {"_id": 0, "slug": 1})}
        all_articles = BLOG_ARTICLES + V3_BLOG_ARTICLES
        new_articles = [a for a in all_articles if a['slug'] not in existing_slugs]
        if new_articles:
            await db.blog_articles.insert_many([dict(a) for a in new_articles])
            logger.info(f"Seeded {len(new_articles)} new blog articles")
    except Exception as e:
        logger.warning(f"Skipping blog seed because database is unavailable: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    if db_client is not None:
        db_client.close()
