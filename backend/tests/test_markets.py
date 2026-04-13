"""Tests for Markets endpoints: /api/market/rates and /api/market/housing"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMarketRates:
    """Test /api/market/rates - 5 FRED rates + 7 ETFs"""

    def test_rates_status_200(self):
        r = requests.get(f"{BASE_URL}/api/market/rates", timeout=15)
        assert r.status_code == 200

    def test_rates_has_rates_object(self):
        r = requests.get(f"{BASE_URL}/api/market/rates", timeout=15)
        data = r.json()
        assert "rates" in data

    def test_rates_five_fields(self):
        r = requests.get(f"{BASE_URL}/api/market/rates", timeout=15)
        rates = r.json()["rates"]
        for key in ["mortgage_30y", "mortgage_15y", "fed_funds", "prime", "sofr"]:
            assert key in rates, f"Missing rate: {key}"
            assert isinstance(rates[key], (int, float)), f"Rate {key} is not a number"
            assert rates[key] > 0, f"Rate {key} is zero or negative"

    def test_rates_has_stocks_object(self):
        r = requests.get(f"{BASE_URL}/api/market/rates", timeout=15)
        data = r.json()
        assert "stocks" in data

    def test_rates_seven_etfs(self):
        r = requests.get(f"{BASE_URL}/api/market/rates", timeout=15)
        stocks = r.json()["stocks"]
        for sym in ["spy", "qqq", "dia", "vnq", "iwm", "tlt", "gld"]:
            assert sym in stocks, f"Missing ETF: {sym}"
            etf = stocks[sym]
            assert "c" in etf and etf["c"] > 0, f"ETF {sym} missing price"
            assert "dp" in etf, f"ETF {sym} missing dp"

    def test_rates_updated_at_present(self):
        r = requests.get(f"{BASE_URL}/api/market/rates", timeout=15)
        data = r.json()
        assert "updated_at" in data


class TestMarketHousing:
    """Test /api/market/housing - national stats + 20 cities"""

    def test_housing_status_200(self):
        r = requests.get(f"{BASE_URL}/api/market/housing", timeout=30)
        assert r.status_code == 200

    def test_housing_national_hpi(self):
        r = requests.get(f"{BASE_URL}/api/market/housing", timeout=30)
        data = r.json()
        assert "national" in data
        hpi = data["national"]["hpi"]
        assert "value" in hpi
        assert "yoy" in hpi
        assert hpi["value"] is not None
        assert isinstance(hpi["value"], (int, float))

    def test_housing_national_median_price(self):
        r = requests.get(f"{BASE_URL}/api/market/housing", timeout=30)
        data = r.json()
        mp = data["national"]["median_price"]
        assert mp is not None and mp > 0

    def test_housing_national_housing_starts(self):
        r = requests.get(f"{BASE_URL}/api/market/housing", timeout=30)
        data = r.json()
        hs = data["national"]["housing_starts"]
        assert hs is not None and hs > 0

    def test_housing_cities_count(self):
        r = requests.get(f"{BASE_URL}/api/market/housing", timeout=30)
        cities = r.json()["cities"]
        assert len(cities) == 20, f"Expected 20 cities, got {len(cities)}"

    def test_housing_cities_have_value_and_yoy(self):
        r = requests.get(f"{BASE_URL}/api/market/housing", timeout=30)
        cities = r.json()["cities"]
        for city, cdata in cities.items():
            assert "value" in cdata, f"City {city} missing value"
            assert "yoy" in cdata, f"City {city} missing yoy"

    def test_housing_expected_cities_present(self):
        r = requests.get(f"{BASE_URL}/api/market/housing", timeout=30)
        cities = r.json()["cities"]
        expected = ["New York", "Los Angeles", "Chicago", "Dallas", "Miami"]
        for c in expected:
            assert c in cities, f"Missing city: {c}"
