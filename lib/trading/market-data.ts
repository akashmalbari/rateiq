import { formatISO, subDays } from "date-fns";
import { serverEnv } from "@/lib/env";
import { clamp } from "@/lib/utils";
import { DEFAULT_NASDAQ_100_UNIVERSE } from "@/lib/trading/nasdaq100";
import type {
  Candle,
  EarningsEvent,
  MarketDataProvider,
  OptionContract,
  OptionsChain,
  Quote
} from "@/lib/trading/types";

function hashUnit(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

function nextFriday(daysFromNow: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  const day = date.getUTCDay();
  const offset = (5 - day + 7) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return formatISO(date, { representation: "date" });
}

function daysUntilExpiration(expirationDate: string) {
  return Math.round((new Date(`${expirationDate}T00:00:00Z`).getTime() - Date.now()) / 86_400_000);
}

function companyBasePrice(symbol: string) {
  const highPriceSymbols = new Set(["BKNG", "MELI", "ASML", "ORLY", "REGN", "LRCX"]);
  const megaCaps = new Set(["AAPL", "MSFT", "NVDA", "META", "AVGO", "COST", "TSLA"]);
  if (highPriceSymbols.has(symbol)) return 550 + hashUnit(`${symbol}:high`) * 900;
  if (megaCaps.has(symbol)) return 180 + hashUnit(`${symbol}:mega`) * 520;
  return 35 + hashUnit(`${symbol}:base`) * 275;
}

function contractSymbol(symbol: string, expirationDate: string, type: "call" | "put", strike: number) {
  return `${symbol}${expirationDate.replaceAll("-", "").slice(2)}${type[0].toUpperCase()}${String(Math.round(strike * 1000)).padStart(8, "0")}`;
}

function createDemoContract(
  underlyingSymbol: string,
  price: number,
  expirationDate: string,
  strike: number,
  type: "call" | "put",
  index: number
): OptionContract {
  const moneyness =
    type === "call" ? (strike - price) / price : (price - strike) / price;
  const distance = Math.abs(strike - price) / price;
  const daysToExpiration = Math.max(5, daysUntilExpiration(expirationDate));
  const iv =
    0.22 +
    hashUnit(`${underlyingSymbol}:${expirationDate}:${type}:iv`) * 0.34 +
    distance * 0.8;
  const extrinsic = price * iv * Math.sqrt(daysToExpiration / 365) * Math.exp(-distance * 8);
  const intrinsic =
    type === "call" ? Math.max(price - strike, 0) : Math.max(strike - price, 0);
  const mid = Math.max(0.08, intrinsic + extrinsic * (0.28 + hashUnit(`${underlyingSymbol}:${strike}:mid`) * 0.42));
  const spreadPct = 0.035 + hashUnit(`${underlyingSymbol}:${strike}:spread`) * 0.12;
  const bid = Math.max(0.01, mid * (1 - spreadPct / 2));
  const ask = mid * (1 + spreadPct / 2);
  const liquidityCenter = Math.max(0.04, 1 - distance * 7);
  const volume = Math.round(50 + liquidityCenter * 2200 + hashUnit(`${underlyingSymbol}:${strike}:vol`) * 900);
  const openInterest = Math.round(200 + liquidityCenter * 7000 + hashUnit(`${underlyingSymbol}:${strike}:oi`) * 2300);
  const rawDelta =
    type === "call"
      ? clamp(0.52 - moneyness * 7, 0.04, 0.96)
      : -clamp(0.52 - moneyness * 7, 0.04, 0.96);

  return {
    symbol: contractSymbol(underlyingSymbol, expirationDate, type, strike),
    underlyingSymbol,
    expirationDate,
    strike,
    type,
    bid: Number(bid.toFixed(2)),
    ask: Number(ask.toFixed(2)),
    last: Number(mid.toFixed(2)),
    volume,
    openInterest,
    impliedVolatility: Number(iv.toFixed(4)),
    delta: Number(rawDelta.toFixed(3)),
    gamma: Number((0.018 + hashUnit(`${underlyingSymbol}:${index}:gamma`) * 0.045).toFixed(4)),
    theta: Number((-(mid * 0.012 + distance * 0.04)).toFixed(4)),
    vega: Number((mid * 0.06 + price * 0.0008).toFixed(4))
  };
}

export class DemoMarketDataProvider implements MarketDataProvider {
  name = "demo";

  async getQuote(symbol: string): Promise<Quote> {
    const price = companyBasePrice(symbol);
    const drift = (hashUnit(`${symbol}:${new Date().toISOString().slice(0, 10)}:drift`) - 0.48) * 4.2;
    const current = Number((price * (1 + drift / 100)).toFixed(2));
    const previousClose = Number((current / (1 + drift / 100)).toFixed(2));
    return {
      symbol,
      price: current,
      previousClose,
      changePercent: Number(drift.toFixed(2)),
      volume: Math.round(1_000_000 + hashUnit(`${symbol}:volume`) * 28_000_000),
      vwap: Number((current * (0.992 + hashUnit(`${symbol}:vwap`) * 0.018)).toFixed(2)),
      marketCap: Math.round(current * (400_000_000 + hashUnit(`${symbol}:shares`) * 9_000_000_000))
    };
  }

  async getCandles(symbol: string, lookbackDays: number): Promise<Candle[]> {
    const basePrice = companyBasePrice(symbol);
    const trend = (hashUnit(`${symbol}:trend`) - 0.46) * 0.0035;
    const volatility = 0.012 + hashUnit(`${symbol}:volatility`) * 0.028;
    const candles: Candle[] = [];
    let close = basePrice * (0.88 + hashUnit(`${symbol}:anchor`) * 0.24);
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);

    for (let index = lookbackDays - 1; index >= 0; index -= 1) {
      const date = subDays(end, index);
      const daySeed = hashUnit(`${symbol}:${formatISO(date, { representation: "date" })}`);
      const shock = (daySeed - 0.5) * volatility * 2;
      const open = close * (1 + (hashUnit(`${symbol}:${index}:open`) - 0.5) * volatility);
      close = Math.max(4, close * (1 + trend + shock));
      const range = close * volatility * (0.85 + daySeed);
      candles.push({
        date: formatISO(date, { representation: "date" }),
        open: Number(open.toFixed(2)),
        high: Number((Math.max(open, close) + range * 0.55).toFixed(2)),
        low: Number((Math.min(open, close) - range * 0.45).toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.round(600_000 + hashUnit(`${symbol}:${index}:candle-volume`) * 14_000_000)
      });
    }

    return candles;
  }

  async getOptionsChain(symbol: string): Promise<OptionsChain> {
    const quote = await this.getQuote(symbol);
    const expirations = [nextFriday(7), nextFriday(14), nextFriday(21), nextFriday(32), nextFriday(45), nextFriday(60)];
    const contracts: OptionContract[] = [];
    const increment = quote.price > 500 ? 10 : quote.price > 150 ? 5 : 2.5;

    for (const expirationDate of expirations) {
      for (let offset = -20; offset <= 20; offset += 1) {
        const strike = Math.max(increment, Math.round((quote.price + offset * increment) / increment) * increment);
        contracts.push(createDemoContract(symbol, quote.price, expirationDate, strike, "call", offset));
        contracts.push(createDemoContract(symbol, quote.price, expirationDate, strike, "put", offset));
      }
    }

    return {
      underlyingSymbol: symbol,
      capturedAt: new Date().toISOString(),
      contracts
    };
  }

  async getEarningsDate(symbol: string): Promise<EarningsEvent> {
    const distance = Math.round(8 + hashUnit(`${symbol}:earnings`) * 72);
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + distance);
    return {
      symbol,
      date: formatISO(date, { representation: "date" }),
      confirmed: hashUnit(`${symbol}:earnings-confirmed`) > 0.45
    };
  }

  async getVixLevel(): Promise<number> {
    return Number((13.5 + hashUnit(`vix:${new Date().toISOString().slice(0, 10)}`) * 16).toFixed(1));
  }

  async getMarketBreadth(symbols: string[]): Promise<number> {
    if (!symbols.length) return 50;
    let aboveSma50 = 0;
    for (const symbol of symbols.slice(0, 35)) {
      const candles = await this.getCandles(symbol, 80);
      const closes = candles.map((candle) => candle.close);
      const latest = closes.at(-1) ?? 0;
      const sma50 = closes.slice(-50).reduce((sum, close) => sum + close, 0) / 50;
      if (latest > sma50) aboveSma50 += 1;
    }
    return Math.round((aboveSma50 / Math.min(symbols.length, 35)) * 100);
  }
}

class TradierMarketDataProvider extends DemoMarketDataProvider {
  name = "tradier";

  private async request<T>(path: string, params: Record<string, string>) {
    const url = new URL(`${serverEnv.TRADIER_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${serverEnv.TRADIER_ACCESS_TOKEN}`,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Tradier request failed ${response.status}: ${path}`);
    }

    return (await response.json()) as T;
  }

  async getQuote(symbol: string): Promise<Quote> {
    if (!serverEnv.TRADIER_ACCESS_TOKEN) return super.getQuote(symbol);
    const data = await this.request<{
      quotes?: {
        quote?: {
          symbol: string;
          last: number;
          prevclose: number;
          change_percentage: number;
          volume: number;
          average_volume?: number;
        };
      };
    }>("/markets/quotes", { symbols: symbol });
    const quote = data.quotes?.quote;
    if (!quote?.last) return super.getQuote(symbol);
    return {
      symbol,
      price: Number(quote.last),
      previousClose: Number(quote.prevclose ?? quote.last),
      changePercent: Number(quote.change_percentage ?? 0),
      volume: Number(quote.volume ?? quote.average_volume ?? 0)
    };
  }

  async getCandles(symbol: string, lookbackDays: number): Promise<Candle[]> {
    if (!serverEnv.TRADIER_ACCESS_TOKEN) return super.getCandles(symbol, lookbackDays);
    const end = formatISO(new Date(), { representation: "date" });
    const start = formatISO(subDays(new Date(), lookbackDays + 20), { representation: "date" });
    const data = await this.request<{
      history?: {
        day?: Array<{
          date: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }>;
      };
    }>("/markets/history", { symbol, interval: "daily", start, end });
    const days = data.history?.day ?? [];
    if (days.length < 50) return super.getCandles(symbol, lookbackDays);
    return days.slice(-lookbackDays).map((day) => ({
      date: day.date,
      open: Number(day.open),
      high: Number(day.high),
      low: Number(day.low),
      close: Number(day.close),
      volume: Number(day.volume)
    }));
  }

  async getOptionsChain(symbol: string): Promise<OptionsChain> {
    if (!serverEnv.TRADIER_ACCESS_TOKEN) return super.getOptionsChain(symbol);
    const expirations = await this.request<{
      expirations?: { date?: string[] | string };
    }>("/markets/options/expirations", { symbol, includeAllRoots: "true", strikes: "false" });
    const dates = Array.isArray(expirations.expirations?.date)
      ? expirations.expirations?.date
      : expirations.expirations?.date
        ? [expirations.expirations.date]
        : [];
    const targetDates = dates
      .filter((date) => {
        const days = daysUntilExpiration(date);
        return days >= 5 && days <= 60;
      })
      .slice(0, 6);
    if (!targetDates.length) {
      return {
        underlyingSymbol: symbol,
        capturedAt: new Date().toISOString(),
        contracts: []
      };
    }

    type TradierOption = {
      symbol: string;
      expiration_date: string;
      strike: number;
      option_type: "call" | "put";
      bid: number;
      ask: number;
      last?: number;
      volume: number;
      open_interest: number;
      greeks?: {
        mid_iv?: number;
        delta?: number;
        gamma?: number;
        theta?: number;
        vega?: number;
      };
    };
    type TradierChain = {
      options?: {
        option?: TradierOption[] | TradierOption;
      };
    };

    const chains = await Promise.allSettled(
      targetDates.map((expiration) =>
        this.request<TradierChain>("/markets/options/chains", { symbol, expiration, greeks: "true" })
      )
    );

    const contracts = chains.flatMap((result) => {
      if (result.status !== "fulfilled") return [];
      const rawOptions = result.value.options?.option ?? [];
      const options = Array.isArray(rawOptions) ? rawOptions : [rawOptions];
      return options.map((contract) => ({
        symbol: contract.symbol,
        underlyingSymbol: symbol,
        expirationDate: contract.expiration_date,
        strike: Number(contract.strike),
        type: contract.option_type,
        bid: Number(contract.bid ?? 0),
        ask: Number(contract.ask ?? 0),
        last: contract.last ? Number(contract.last) : undefined,
        volume: Number(contract.volume ?? 0),
        openInterest: Number(contract.open_interest ?? 0),
        impliedVolatility: Number(contract.greeks?.mid_iv ?? 0.3),
        delta: Number(contract.greeks?.delta ?? 0),
        gamma: Number(contract.greeks?.gamma ?? 0),
        theta: Number(contract.greeks?.theta ?? 0),
        vega: Number(contract.greeks?.vega ?? 0)
      }));
    });

    return {
      underlyingSymbol: symbol,
      capturedAt: new Date().toISOString(),
      contracts
    };
  }
}

class PolygonFinnhubMarketDataProvider extends DemoMarketDataProvider {
  name = serverEnv.MARKET_DATA_PROVIDER === "finnhub" ? "finnhub" : "polygon";

  async getQuote(symbol: string): Promise<Quote> {
    if (serverEnv.MARKET_DATA_PROVIDER === "polygon" && serverEnv.POLYGON_API_KEY) {
      const url = new URL(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`);
      url.searchParams.set("apiKey", serverEnv.POLYGON_API_KEY);
      const response = await fetch(url, { next: { revalidate: 45 } });
      if (response.ok) {
        const data = await response.json();
        const ticker = data.ticker;
        if (ticker?.day?.c) {
          const current = Number(ticker.day.c);
          const previousClose = Number(ticker.prevDay?.c ?? current);
          return {
            symbol,
            price: current,
            previousClose,
            changePercent: previousClose ? ((current - previousClose) / previousClose) * 100 : 0,
            volume: Number(ticker.day?.v ?? 0),
            vwap: Number(ticker.day?.vw ?? current)
          };
        }
      }
    }

    if (serverEnv.MARKET_DATA_PROVIDER === "finnhub" && serverEnv.FINNHUB_API_KEY) {
      const url = new URL("https://finnhub.io/api/v1/quote");
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("token", serverEnv.FINNHUB_API_KEY);
      const response = await fetch(url, { next: { revalidate: 45 } });
      if (response.ok) {
        const data = await response.json();
        if (data.c) {
          return {
            symbol,
            price: Number(data.c),
            previousClose: Number(data.pc ?? data.c),
            changePercent: Number(data.dp ?? 0),
            volume: 0
          };
        }
      }
    }

    return super.getQuote(symbol);
  }
}

export function createMarketDataProvider(): MarketDataProvider {
  const provider = serverEnv.MARKET_DATA_PROVIDER.toLowerCase();
  if (provider === "tradier" || provider === "composite") return new TradierMarketDataProvider();
  if (provider === "polygon" || provider === "finnhub") return new PolygonFinnhubMarketDataProvider();
  return new DemoMarketDataProvider();
}

export function getUniverseSymbolsForBreadth() {
  return DEFAULT_NASDAQ_100_UNIVERSE.map((item) => item.symbol);
}
