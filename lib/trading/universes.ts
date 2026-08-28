import { getNasdaq100Universe } from "@/lib/trading/nasdaq100";
import type { UniverseGroup, UniverseSymbol } from "@/lib/trading/types";

// A curated discovery pool of non-NASDAQ-100 stocks with actively traded options.
// Live quotes keep only symbols trading from $10.00 through $99.99.
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

export function getDailyOptionsUniverse(adminPickSymbols: string[] = []): UniverseSymbol[] {
  const nasdaq100 = getNasdaq100Universe().map((symbol) => ({
    ...symbol,
    universeGroup: "nasdaq_100" as const
  }));
  const nasdaqSymbols = new Set(nasdaq100.map((symbol) => symbol.symbol));
  const priceScreen = EXPANDED_PRICE_SCREEN_UNIVERSE.filter(
    (symbol) => !nasdaqSymbols.has(symbol.symbol)
  );
  const adminPicks = adminPickSymbols.map((symbol) => ({
    symbol,
    companyName: symbol,
    sector: "Admin's Picks",
    universeGroup: "admin_picks" as const
  }));

  // Preserve the administrator's input order so genuinely new picks are not
  // pushed behind the two built-in universes when provider capacity is tight.
  return [...adminPicks, ...nasdaq100, ...priceScreen];
}

export function resolveUniverseGroup(
  symbol: UniverseSymbol,
  price: number
): UniverseGroup | null {
  if (symbol.universeGroup) return symbol.universeGroup;
  if (price >= 10 && price < 100) return "under_100";
  return null;
}
