import { serverEnv } from "@/lib/env";
import type { UniverseSymbol } from "@/lib/trading/types";

export const DEFAULT_NASDAQ_100_UNIVERSE: UniverseSymbol[] = [
  { symbol: "AAPL", companyName: "Apple", sector: "Technology" },
  { symbol: "ABNB", companyName: "Airbnb", sector: "Consumer Cyclical" },
  { symbol: "ADBE", companyName: "Adobe", sector: "Technology" },
  { symbol: "ADI", companyName: "Analog Devices", sector: "Technology" },
  { symbol: "ADP", companyName: "Automatic Data Processing", sector: "Industrials" },
  { symbol: "ADSK", companyName: "Autodesk", sector: "Technology" },
  { symbol: "AEP", companyName: "American Electric Power", sector: "Utilities" },
  { symbol: "AMAT", companyName: "Applied Materials", sector: "Technology" },
  { symbol: "AMD", companyName: "Advanced Micro Devices", sector: "Technology" },
  { symbol: "AMGN", companyName: "Amgen", sector: "Healthcare" },
  { symbol: "AMZN", companyName: "Amazon", sector: "Consumer Cyclical" },
  { symbol: "ANSS", companyName: "Ansys", sector: "Technology" },
  { symbol: "APP", companyName: "AppLovin", sector: "Technology" },
  { symbol: "ARM", companyName: "Arm Holdings", sector: "Technology" },
  { symbol: "ASML", companyName: "ASML Holding", sector: "Technology" },
  { symbol: "AVGO", companyName: "Broadcom", sector: "Technology" },
  { symbol: "AXON", companyName: "Axon Enterprise", sector: "Industrials" },
  { symbol: "BKR", companyName: "Baker Hughes", sector: "Energy" },
  { symbol: "BKNG", companyName: "Booking Holdings", sector: "Consumer Cyclical" },
  { symbol: "CCEP", companyName: "Coca-Cola Europacific Partners", sector: "Consumer Defensive" },
  { symbol: "CDNS", companyName: "Cadence Design Systems", sector: "Technology" },
  { symbol: "CEG", companyName: "Constellation Energy", sector: "Utilities" },
  { symbol: "CHTR", companyName: "Charter Communications", sector: "Communication Services" },
  { symbol: "CMCSA", companyName: "Comcast", sector: "Communication Services" },
  { symbol: "COST", companyName: "Costco Wholesale", sector: "Consumer Defensive" },
  { symbol: "CPRT", companyName: "Copart", sector: "Industrials" },
  { symbol: "CRWD", companyName: "CrowdStrike", sector: "Technology" },
  { symbol: "CSCO", companyName: "Cisco Systems", sector: "Technology" },
  { symbol: "CSGP", companyName: "CoStar Group", sector: "Real Estate" },
  { symbol: "CSX", companyName: "CSX", sector: "Industrials" },
  { symbol: "CTAS", companyName: "Cintas", sector: "Industrials" },
  { symbol: "CTSH", companyName: "Cognizant Technology Solutions", sector: "Technology" },
  { symbol: "DASH", companyName: "DoorDash", sector: "Consumer Cyclical" },
  { symbol: "DDOG", companyName: "Datadog", sector: "Technology" },
  { symbol: "DXCM", companyName: "DexCom", sector: "Healthcare" },
  { symbol: "EA", companyName: "Electronic Arts", sector: "Communication Services" },
  { symbol: "EXC", companyName: "Exelon", sector: "Utilities" },
  { symbol: "FANG", companyName: "Diamondback Energy", sector: "Energy" },
  { symbol: "FAST", companyName: "Fastenal", sector: "Industrials" },
  { symbol: "FTNT", companyName: "Fortinet", sector: "Technology" },
  { symbol: "GEHC", companyName: "GE HealthCare", sector: "Healthcare" },
  { symbol: "GILD", companyName: "Gilead Sciences", sector: "Healthcare" },
  { symbol: "GOOG", companyName: "Alphabet Class C", sector: "Communication Services" },
  { symbol: "GOOGL", companyName: "Alphabet Class A", sector: "Communication Services" },
  { symbol: "HON", companyName: "Honeywell", sector: "Industrials" },
  { symbol: "IDXX", companyName: "IDEXX Laboratories", sector: "Healthcare" },
  { symbol: "INTU", companyName: "Intuit", sector: "Technology" },
  { symbol: "ISRG", companyName: "Intuitive Surgical", sector: "Healthcare" },
  { symbol: "KDP", companyName: "Keurig Dr Pepper", sector: "Consumer Defensive" },
  { symbol: "KHC", companyName: "Kraft Heinz", sector: "Consumer Defensive" },
  { symbol: "KLAC", companyName: "KLA", sector: "Technology" },
  { symbol: "LIN", companyName: "Linde", sector: "Basic Materials" },
  { symbol: "LRCX", companyName: "Lam Research", sector: "Technology" },
  { symbol: "LULU", companyName: "Lululemon Athletica", sector: "Consumer Cyclical" },
  { symbol: "MAR", companyName: "Marriott International", sector: "Consumer Cyclical" },
  { symbol: "MCHP", companyName: "Microchip Technology", sector: "Technology" },
  { symbol: "MDLZ", companyName: "Mondelez International", sector: "Consumer Defensive" },
  { symbol: "MELI", companyName: "MercadoLibre", sector: "Consumer Cyclical" },
  { symbol: "META", companyName: "Meta Platforms", sector: "Communication Services" },
  { symbol: "MNST", companyName: "Monster Beverage", sector: "Consumer Defensive" },
  { symbol: "MRVL", companyName: "Marvell Technology", sector: "Technology" },
  { symbol: "MSFT", companyName: "Microsoft", sector: "Technology" },
  { symbol: "MSTR", companyName: "MicroStrategy", sector: "Technology" },
  { symbol: "MU", companyName: "Micron Technology", sector: "Technology" },
  { symbol: "NFLX", companyName: "Netflix", sector: "Communication Services" },
  { symbol: "NVDA", companyName: "NVIDIA", sector: "Technology" },
  { symbol: "NXPI", companyName: "NXP Semiconductors", sector: "Technology" },
  { symbol: "ODFL", companyName: "Old Dominion Freight Line", sector: "Industrials" },
  { symbol: "ON", companyName: "ON Semiconductor", sector: "Technology" },
  { symbol: "ORLY", companyName: "O'Reilly Automotive", sector: "Consumer Cyclical" },
  { symbol: "PANW", companyName: "Palo Alto Networks", sector: "Technology" },
  { symbol: "PAYX", companyName: "Paychex", sector: "Industrials" },
  { symbol: "PCAR", companyName: "PACCAR", sector: "Industrials" },
  { symbol: "PDD", companyName: "PDD Holdings", sector: "Consumer Cyclical" },
  { symbol: "PEP", companyName: "PepsiCo", sector: "Consumer Defensive" },
  { symbol: "PLTR", companyName: "Palantir", sector: "Technology" },
  { symbol: "PYPL", companyName: "PayPal", sector: "Financial Services" },
  { symbol: "QCOM", companyName: "Qualcomm", sector: "Technology" },
  { symbol: "REGN", companyName: "Regeneron Pharmaceuticals", sector: "Healthcare" },
  { symbol: "ROP", companyName: "Roper Technologies", sector: "Technology" },
  { symbol: "ROST", companyName: "Ross Stores", sector: "Consumer Cyclical" },
  { symbol: "SBUX", companyName: "Starbucks", sector: "Consumer Cyclical" },
  { symbol: "SNDK", companyName: "SanDisk", sector: "Technology" },
  { symbol: "SNPS", companyName: "Synopsys", sector: "Technology" },
  { symbol: "TMUS", companyName: "T-Mobile US", sector: "Communication Services" },
  { symbol: "TSLA", companyName: "Tesla", sector: "Consumer Cyclical" },
  { symbol: "TTD", companyName: "The Trade Desk", sector: "Technology" },
  { symbol: "TTWO", companyName: "Take-Two Interactive", sector: "Communication Services" },
  { symbol: "TXN", companyName: "Texas Instruments", sector: "Technology" },
  { symbol: "VRSK", companyName: "Verisk Analytics", sector: "Industrials" },
  { symbol: "VRTX", companyName: "Vertex Pharmaceuticals", sector: "Healthcare" },
  { symbol: "WBD", companyName: "Warner Bros. Discovery", sector: "Communication Services" },
  { symbol: "WDAY", companyName: "Workday", sector: "Technology" },
  { symbol: "XEL", companyName: "Xcel Energy", sector: "Utilities" },
  { symbol: "ZS", companyName: "Zscaler", sector: "Technology" }
];

export function getNasdaq100Universe(): UniverseSymbol[] {
  if (!serverEnv.NASDAQ_100_SYMBOLS) {
    return DEFAULT_NASDAQ_100_UNIVERSE;
  }

  const bySymbol = new Map(
    DEFAULT_NASDAQ_100_UNIVERSE.map((item) => [item.symbol, item])
  );

  return serverEnv.NASDAQ_100_SYMBOLS.split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .map(
      (symbol) =>
        bySymbol.get(symbol) ?? {
          symbol,
          companyName: symbol,
          sector: "Unclassified"
        }
    );
}
