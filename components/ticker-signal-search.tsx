"use client";

import { FormEvent, useState } from "react";
import { Loader2, Search, TriangleAlert } from "lucide-react";
import { TradeCard } from "@/components/trade-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MarketRegime, Recommendation } from "@/lib/trading/types";

interface TickerScanResponse {
  recommendations?: Recommendation[];
  marketRegime?: MarketRegime;
  warnings?: string[];
  error?: string;
}

function normalizeTicker(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

export function TickerSignalSearch() {
  const [symbol, setSymbol] = useState("");
  const [searchedSymbol, setSearchedSymbol] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function runSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = normalizeTicker(symbol);
    setSymbol(ticker);
    setError("");
    setWarnings([]);

    if (!ticker) {
      setError("Enter a ticker.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/recommendations?symbol=${encodeURIComponent(ticker)}&limit=5`, {
        cache: "no-store"
      });
      const body = (await response.json()) as TickerScanResponse;
      if (!response.ok) {
        throw new Error(body.error ?? "Ticker scan failed.");
      }

      setSearchedSymbol(ticker);
      setRecommendations(body.recommendations ?? []);
      setMarketRegime(body.marketRegime ?? null);
      setWarnings(body.warnings ?? []);
    } catch (caughtError) {
      setRecommendations([]);
      setMarketRegime(null);
      setError(caughtError instanceof Error ? caughtError.message : "Ticker scan failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-8 space-y-5 rounded-lg border border-white/10 bg-[#111720]/70 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="blue">Ticker scan</Badge>
          <h2 className="mt-3 font-heading text-2xl font-bold text-white">
            Single Ticker Options Signals
          </h2>
          {marketRegime ? (
            <p className="mt-2 text-sm text-slate-400">
              Market regime: {marketRegime.label.replaceAll("_", " ")} / score {marketRegime.score}
            </p>
          ) : null}
        </div>

        <form onSubmit={runSearch} className="grid gap-2 sm:grid-cols-[minmax(180px,260px)_auto]">
          <Input
            aria-label="Ticker"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="TSLA"
            maxLength={10}
            className="font-mono"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
            Scan
          </Button>
        </form>
      </div>

      {error ? (
        <div className="flex gap-2 rounded-md border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {warnings.length ? (
        <div className="flex gap-2 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{warnings[0]}</span>
        </div>
      ) : null}

      {searchedSymbol && !isLoading && !recommendations.length && !error ? (
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
          No liquid, risk-bounded setups cleared the filters for {searchedSymbol}.
        </div>
      ) : null}

      {recommendations.length ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="data-label">Top 5 for {searchedSymbol}</p>
            <Badge variant="success">{recommendations.length} ranked</Badge>
          </div>
          {recommendations.map((recommendation) => (
            <TradeCard
              key={`${recommendation.symbol}-${recommendation.strategyType}-${recommendation.expirationDate}-${recommendation.strikePrice}`}
              recommendation={recommendation}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
