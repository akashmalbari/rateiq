import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateShortOptionRolls } from "@/lib/trading/roll-calculator";
import { createMarketDataProvider } from "@/lib/trading/market-data";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import type { OptionContract } from "@/lib/trading/types";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.-]{1,10}$/),
  type: z.enum(["call", "put"]),
  currentStrike: z.number().positive(),
  currentExpiration: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closeDebit: z.number().positive(),
  entryCredit: z.number().nonnegative().default(0),
  contracts: z.number().int().positive().max(100).default(1),
  currentDelta: z.number().min(-1).max(1).optional(),
  allowDebitRoll: z.boolean().default(false)
});

function fallbackContract(
  input: z.infer<typeof requestSchema>,
  underlyingPrice: number,
  nearest: OptionContract | undefined
): OptionContract {
  const moneyness = input.type === "call"
    ? (underlyingPrice - input.currentStrike) / underlyingPrice
    : (input.currentStrike - underlyingPrice) / underlyingPrice;
  const estimatedDelta = input.type === "call"
    ? Math.min(0.96, Math.max(0.04, 0.52 + moneyness * 3.5))
    : -Math.min(0.96, Math.max(0.04, 0.52 + moneyness * 3.5));

  return {
    symbol: `${input.symbol}-manual-current`,
    underlyingSymbol: input.symbol,
    expirationDate: input.currentExpiration,
    strike: input.currentStrike,
    type: input.type,
    bid: Math.max(0.01, input.closeDebit * 0.97),
    ask: input.closeDebit,
    volume: nearest?.volume ?? 500,
    openInterest: nearest?.openInterest ?? 1_000,
    impliedVolatility: nearest?.impliedVolatility ?? 0.3,
    delta: input.currentDelta ?? estimatedDelta,
    gamma: nearest?.gamma ?? 0.02,
    theta: nearest?.theta ?? -0.08,
    vega: nearest?.vega ?? 0.12
  };
}

export async function POST(request: Request) {
  const limit = rateLimit(`roll-calculator:${getClientIp(request)}`, 12, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid ticker, option details, and close price." }, { status: 400 });
  }

  try {
    const input = parsed.data;
    const provider = createMarketDataProvider();
    const [quote, chain] = await Promise.all([provider.getQuote(input.symbol), provider.getOptionsChain(input.symbol)]);
    const matchingContract = chain.contracts.find(
      (contract) =>
        contract.type === input.type &&
        contract.expirationDate === input.currentExpiration &&
        Math.abs(contract.strike - input.currentStrike) < 0.001
    );
    const nearest = chain.contracts
      .filter((contract) => contract.type === input.type)
      .sort((left, right) => Math.abs(left.strike - input.currentStrike) - Math.abs(right.strike - input.currentStrike))[0];
    const currentContract = matchingContract
      ? { ...matchingContract, ask: input.closeDebit }
      : fallbackContract(input, quote.price, nearest);
    const analysis = calculateShortOptionRolls({
      underlyingPrice: quote.price,
      asOfDate: new Date().toISOString().slice(0, 10),
      currentContract,
      entryCredit: input.entryCredit,
      contracts: input.contracts,
      chain,
      allowDebitRoll: input.allowDebitRoll
    });

    return NextResponse.json({ quote, analysis, source: provider.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to calculate roll options.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
