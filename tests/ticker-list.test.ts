import { describe, expect, it } from "vitest";
import { MAX_ADMIN_PICK_SYMBOLS, parseTickerList } from "@/lib/trading/ticker-list";

describe("Admin's Picks ticker list", () => {
  it("normalizes comma, whitespace, semicolon, and newline-separated symbols", () => {
    expect(parseTickerList("aapl, $msft; nvda\nAAPL tsla")).toEqual({
      symbols: ["AAPL", "MSFT", "NVDA", "TSLA"],
      invalid: [],
      exceedsLimit: false
    });
  });

  it("reports invalid symbols instead of silently saving them", () => {
    const parsed = parseTickerList("AAPL, BAD/TICKER, MSFT");

    expect(parsed.symbols).toEqual(["AAPL", "MSFT"]);
    expect(parsed.invalid).toEqual(["BAD/TICKER"]);
  });

  it("accepts 100 unique symbols and rejects the 101st", () => {
    const symbols = Array.from({ length: MAX_ADMIN_PICK_SYMBOLS + 1 }, (_, index) =>
      `T${String(index).padStart(3, "0")}`
    );

    expect(parseTickerList(symbols.slice(0, MAX_ADMIN_PICK_SYMBOLS)).exceedsLimit).toBe(false);
    expect(parseTickerList(symbols).exceedsLimit).toBe(true);
  });
});
