import { getNasdaq100Universe } from "@/lib/trading/nasdaq100";
import type { UniverseGroup, UniverseSymbol } from "@/lib/trading/types";

// A curated discovery pool of non-NASDAQ-100 stocks with actively traded options.
// Live quotes assign each symbol to a price group before its option chain is fetched.
export const EXPANDED_PRICE_SCREEN_UNIVERSE: UniverseSymbol[] = [
  { symbol: "AAL", companyName: "American Airlines", sector: "Industrials" },
  { symbol: "AMC", companyName: "AMC Entertainment", sector: "Communication Services" },
  { symbol: "AUR", companyName: "Aurora Innovation", sector: "Technology" },
  { symbol: "BAC", companyName: "Bank of America", sector: "Financial Services" },
  { symbol: "BB", companyName: "BlackBerry", sector: "Technology" },
  { symbol: "BBAI", companyName: "BigBear.ai", sector: "Technology" },
  { symbol: "BHC", companyName: "Bausch Health", sector: "Healthcare" },
  { symbol: "BMY", companyName: "Bristol Myers Squibb", sector: "Healthcare" },
  { symbol: "C", companyName: "Citigroup", sector: "Financial Services" },
  { symbol: "CCL", companyName: "Carnival", sector: "Consumer Cyclical" },
  { symbol: "CHPT", companyName: "ChargePoint", sector: "Industrials" },
  { symbol: "CLF", companyName: "Cleveland-Cliffs", sector: "Basic Materials" },
  { symbol: "CLOV", companyName: "Clover Health", sector: "Healthcare" },
  { symbol: "CVS", companyName: "CVS Health", sector: "Healthcare" },
  { symbol: "DAL", companyName: "Delta Air Lines", sector: "Industrials" },
  { symbol: "DB", companyName: "Deutsche Bank", sector: "Financial Services" },
  { symbol: "DKNG", companyName: "DraftKings", sector: "Consumer Cyclical" },
  { symbol: "F", companyName: "Ford Motor", sector: "Consumer Cyclical" },
  { symbol: "FCX", companyName: "Freeport-McMoRan", sector: "Basic Materials" },
  { symbol: "FUBO", companyName: "FuboTV", sector: "Communication Services" },
  { symbol: "GME", companyName: "GameStop", sector: "Consumer Cyclical" },
  { symbol: "GM", companyName: "General Motors", sector: "Consumer Cyclical" },
  { symbol: "GRAB", companyName: "Grab Holdings", sector: "Technology" },
  { symbol: "HIMS", companyName: "Hims & Hers Health", sector: "Healthcare" },
  { symbol: "HOOD", companyName: "Robinhood Markets", sector: "Financial Services" },
  { symbol: "HPQ", companyName: "HP", sector: "Technology" },
  { symbol: "JOBY", companyName: "Joby Aviation", sector: "Industrials" },
  { symbol: "KMI", companyName: "Kinder Morgan", sector: "Energy" },
  { symbol: "LCID", companyName: "Lucid Group", sector: "Consumer Cyclical" },
  { symbol: "LUMN", companyName: "Lumen Technologies", sector: "Communication Services" },
  { symbol: "LYFT", companyName: "Lyft", sector: "Technology" },
  { symbol: "MARA", companyName: "MARA Holdings", sector: "Financial Services" },
  { symbol: "NCLH", companyName: "Norwegian Cruise Line", sector: "Consumer Cyclical" },
  { symbol: "NIO", companyName: "NIO", sector: "Consumer Cyclical" },
  { symbol: "NOK", companyName: "Nokia", sector: "Technology" },
  { symbol: "NU", companyName: "Nu Holdings", sector: "Financial Services" },
  { symbol: "OPEN", companyName: "Opendoor Technologies", sector: "Real Estate" },
  { symbol: "PATH", companyName: "UiPath", sector: "Technology" },
  { symbol: "PFE", companyName: "Pfizer", sector: "Healthcare" },
  { symbol: "PLUG", companyName: "Plug Power", sector: "Industrials" },
  { symbol: "QS", companyName: "QuantumScape", sector: "Consumer Cyclical" },
  { symbol: "RBLX", companyName: "Roblox", sector: "Communication Services" },
  { symbol: "RIG", companyName: "Transocean", sector: "Energy" },
  { symbol: "RIOT", companyName: "Riot Platforms", sector: "Financial Services" },
  { symbol: "RIVN", companyName: "Rivian Automotive", sector: "Consumer Cyclical" },
  { symbol: "SCHW", companyName: "Charles Schwab", sector: "Financial Services" },
  { symbol: "SIRI", companyName: "Sirius XM", sector: "Communication Services" },
  { symbol: "SNAP", companyName: "Snap", sector: "Communication Services" },
  { symbol: "SOFI", companyName: "SoFi Technologies", sector: "Financial Services" },
  { symbol: "SOUN", companyName: "SoundHound AI", sector: "Technology" },
  { symbol: "T", companyName: "AT&T", sector: "Communication Services" },
  { symbol: "TLRY", companyName: "Tilray Brands", sector: "Healthcare" },
  { symbol: "UBER", companyName: "Uber Technologies", sector: "Technology" },
  { symbol: "VALE", companyName: "Vale", sector: "Basic Materials" },
  { symbol: "VZ", companyName: "Verizon", sector: "Communication Services" },
  { symbol: "WFC", companyName: "Wells Fargo", sector: "Financial Services" },
  { symbol: "XPEV", companyName: "XPeng", sector: "Consumer Cyclical" }
];

const LEVERAGED_2X_3X_CANDIDATES = [
  { symbol: "TQQQ", companyName: "ProShares UltraPro QQQ", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "SQQQ", companyName: "ProShares UltraPro Short QQQ", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "UPRO", companyName: "ProShares UltraPro S&P 500", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "SPXU", companyName: "ProShares UltraPro Short S&P 500", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "SPXL", companyName: "Direxion Daily S&P 500 Bull", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "SPXS", companyName: "Direxion Daily S&P 500 Bear", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "TNA", companyName: "Direxion Daily Small Cap Bull", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "TZA", companyName: "Direxion Daily Small Cap Bear", sector: "Leveraged Index", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "QLD", companyName: "ProShares Ultra QQQ", sector: "Leveraged Index", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "QID", companyName: "ProShares UltraShort QQQ", sector: "Leveraged Index", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "SSO", companyName: "ProShares Ultra S&P 500", sector: "Leveraged Index", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "SDS", companyName: "ProShares UltraShort S&P 500", sector: "Leveraged Index", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "UWM", companyName: "ProShares Ultra Russell 2000", sector: "Leveraged Index", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "TWM", companyName: "ProShares UltraShort Russell 2000", sector: "Leveraged Index", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "SOXL", companyName: "Direxion Daily Semiconductor Bull", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "SOXS", companyName: "Direxion Daily Semiconductor Bear", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "TECL", companyName: "Direxion Daily Technology Bull", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "TECS", companyName: "Direxion Daily Technology Bear", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "FAS", companyName: "Direxion Daily Financial Bull", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "FAZ", companyName: "Direxion Daily Financial Bear", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "LABU", companyName: "Direxion Daily Biotech Bull", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "LABD", companyName: "Direxion Daily Biotech Bear", sector: "Leveraged Sector", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "YINN", companyName: "Direxion Daily China Bull", sector: "Leveraged International", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "YANG", companyName: "Direxion Daily China Bear", sector: "Leveraged International", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "TMF", companyName: "Direxion Daily 20+ Year Treasury Bull", sector: "Leveraged Fixed Income", leverageMultiple: 3, leverageDirection: "long" },
  { symbol: "TMV", companyName: "Direxion Daily 20+ Year Treasury Bear", sector: "Leveraged Fixed Income", leverageMultiple: 3, leverageDirection: "inverse" },
  { symbol: "USD", companyName: "ProShares Ultra Semiconductors", sector: "Leveraged Sector", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "SSG", companyName: "ProShares UltraShort Semiconductors", sector: "Leveraged Sector", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "ROM", companyName: "ProShares Ultra Technology", sector: "Leveraged Sector", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "REW", companyName: "ProShares UltraShort Technology", sector: "Leveraged Sector", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "BOIL", companyName: "ProShares Ultra Bloomberg Natural Gas", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "KOLD", companyName: "ProShares UltraShort Bloomberg Natural Gas", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "GUSH", companyName: "Direxion Daily Oil & Gas Bull", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "DRIP", companyName: "Direxion Daily Oil & Gas Bear", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "NUGT", companyName: "Direxion Daily Gold Miners Bull", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "DUST", companyName: "Direxion Daily Gold Miners Bear", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "JNUG", companyName: "Direxion Daily Junior Gold Miners Bull", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "JDST", companyName: "Direxion Daily Junior Gold Miners Bear", sector: "Leveraged Commodity", leverageMultiple: 2, leverageDirection: "inverse" },
  { symbol: "BITX", companyName: "Volatility Shares 2x Bitcoin Strategy", sector: "Leveraged Digital Assets", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "BITU", companyName: "ProShares Ultra Bitcoin", sector: "Leveraged Digital Assets", leverageMultiple: 2, leverageDirection: "long" },
  { symbol: "MSTU", companyName: "T-REX 2X Long Strategy", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "MSTR" },
  { symbol: "MSTZ", companyName: "T-REX 2X Inverse Strategy", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "inverse", referenceSymbol: "MSTR" },
  { symbol: "NVDX", companyName: "T-REX 2X Long NVIDIA", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "NVDA" },
  { symbol: "NVDQ", companyName: "T-REX 2X Inverse NVIDIA", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "inverse", referenceSymbol: "NVDA" },
  { symbol: "TSLT", companyName: "T-REX 2X Long Tesla", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "TSLA" },
  { symbol: "TSLZ", companyName: "T-REX 2X Inverse Tesla", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "inverse", referenceSymbol: "TSLA" },
  { symbol: "AAPX", companyName: "T-REX 2X Long Apple", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "AAPL" },
  { symbol: "GOOX", companyName: "T-REX 2X Long Alphabet", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "GOOG" },
  { symbol: "MSFX", companyName: "T-REX 2X Long Microsoft", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "MSFT" },
  { symbol: "NFLU", companyName: "T-REX 2X Long Netflix", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "NFLX" },
  { symbol: "ROBN", companyName: "T-REX 2X Long Robinhood", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "HOOD" },
  { symbol: "RBLU", companyName: "T-REX 2X Long Roblox", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "RBLX" },
  { symbol: "GMEU", companyName: "T-REX 2X Long GameStop", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "GME" },
  { symbol: "CRWU", companyName: "T-REX 2X Long CoreWeave", sector: "Leveraged Single Stock", leverageMultiple: 2, leverageDirection: "long", referenceSymbol: "CRWV" }
] satisfies UniverseSymbol[];

export const LEVERAGED_2X_3X_UNIVERSE: UniverseSymbol[] =
  LEVERAGED_2X_3X_CANDIDATES.map((symbol) => ({
    ...symbol,
    universeGroup: "leveraged"
  }));

export function getDailyOptionsUniverse(): UniverseSymbol[] {
  const nasdaq100 = getNasdaq100Universe().map((symbol) => ({
    ...symbol,
    universeGroup: "nasdaq_100" as const
  }));
  const nasdaqSymbols = new Set(nasdaq100.map((symbol) => symbol.symbol));
  const priceScreen = EXPANDED_PRICE_SCREEN_UNIVERSE.filter(
    (symbol) => !nasdaqSymbols.has(symbol.symbol)
  );

  return [...nasdaq100, ...priceScreen, ...LEVERAGED_2X_3X_UNIVERSE];
}

export function resolveUniverseGroup(
  symbol: UniverseSymbol,
  price: number
): UniverseGroup | null {
  if (symbol.universeGroup) return symbol.universeGroup;
  if (price > 0 && price < 10) return "under_10";
  if (price >= 10 && price < 100) return "under_100";
  return null;
}
