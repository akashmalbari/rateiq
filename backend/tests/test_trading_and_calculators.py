"""
Backend tests for Trading APIs, Blog articles, and existing calculators
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Trading subscribe
class TestTradingSubscribe:
    def test_subscribe_success(self):
        r = requests.post(f"{BASE_URL}/api/trading/subscribe", json={"email": "test@figuremymoney.com"})
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert "access_token" in data
        assert len(data["access_token"]) > 0

    def test_subscribe_invalid_email(self):
        r = requests.post(f"{BASE_URL}/api/trading/subscribe", json={"email": "notanemail"})
        assert r.status_code == 400

# Trading analyze
class TestTradingAnalyze:
    def test_analyze_aapl(self):
        r = requests.post(f"{BASE_URL}/api/trading/analyze", json={"symbol": "AAPL", "strategy": "momentum"})
        assert r.status_code == 200
        data = r.json()
        assert "action" in data
        assert "confidence" in data
        assert "entryPrice" in data
        assert "reasons" in data
        assert data["action"] in ("BUY", "SELL", "HOLD")

    def test_analyze_invalid_symbol(self):
        r = requests.post(f"{BASE_URL}/api/trading/analyze", json={"symbol": "ZZZZZZZZZ", "strategy": "momentum"})
        # Should return 404 or 500 for invalid symbol
        assert r.status_code in (404, 500)

# Trading scan results
class TestTradingScanResults:
    def test_scan_results(self):
        r = requests.get(f"{BASE_URL}/api/trading/scan-results", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "topSignals" in data
        assert isinstance(data["topSignals"], list)
        assert len(data["topSignals"]) >= 3

# Blog articles
class TestBlogArticles:
    def test_get_all_articles(self):
        r = requests.get(f"{BASE_URL}/api/blog/articles")
        assert r.status_code == 200
        data = r.json()
        articles = data if isinstance(data, list) else data.get("articles", [])
        slugs = [a["slug"] for a in articles]
        assert "2026-housing-market-outlook" in slugs
        assert "stock-market-outlook-2026" in slugs

    def test_get_housing_market_article(self):
        r = requests.get(f"{BASE_URL}/api/blog/articles/2026-housing-market-outlook")
        assert r.status_code == 200
        data = r.json()
        assert data["slug"] == "2026-housing-market-outlook"
        assert "title" in data

# Existing APIs
class TestExistingApis:
    def test_market_rates(self):
        r = requests.get(f"{BASE_URL}/api/market/rates")
        assert r.status_code == 200

    def test_blog_list(self):
        r = requests.get(f"{BASE_URL}/api/blog/articles")
        assert r.status_code == 200
