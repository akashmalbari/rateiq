import { describe, expect, it } from "vitest";
import {
  buyOptionFill,
  buyUnderlyingFill,
  daysToExpiration,
  portfolioValues,
  positionUnrealizedPnl,
  sellOptionFill,
  sellUnderlyingFill
} from "@/lib/paper-trading/accounting";
import type { PaperAccount, PaperPosition } from "@/lib/paper-trading/types";
import { determinePaperCloseReason } from "@/lib/paper-trading/engine";

const account: PaperAccount = {
  id: "account-1",
  slug: "figure-my-money-default",
  name: "Paper",
  starting_cash: 25_000,
  cash_balance: 20_399.35,
  status: "active",
  strategy_version: "test",
  strategy_parameters: {},
  started_at: "2026-08-01T14:30:00.000Z"
};

function position(overrides: Partial<PaperPosition> = {}): PaperPosition {
  return {
    id: "position-1",
    account_id: account.id,
    recommendation_id: "recommendation-1",
    open_order_id: "order-1",
    symbol: "TEST",
    strategy_type: "cash_secured_put",
    option_type: "put",
    option_quantity: -1,
    underlying_quantity: 0,
    strike: 50,
    expiration_date: "2026-09-18",
    entry_option_price: 4,
    current_option_price: 3,
    entry_underlying_price: 55,
    current_underlying_price: 56,
    entry_greeks: {},
    current_greeks: {},
    collateral_reserved: 5_000,
    capital_deployed: 5_000,
    status: "open",
    opened_at: "2026-08-07T14:30:00.000Z",
    closed_at: null,
    realized_pnl: null,
    close_reason: null,
    strategy_version: "test",
    ...overrides
  };
}

describe("paper portfolio accounting", () => {
  it("penalizes simulated fills toward the executable side of the spread", () => {
    expect(sellOptionFill(1, 1.2)).toBe(1.05);
    expect(buyOptionFill(1, 1.2)).toBe(1.15);
    expect(buyUnderlyingFill(100)).toBe(100.05);
    expect(sellUnderlyingFill(100)).toBe(99.95);
  });

  it("values cash-secured puts as cash minus the option liability", () => {
    const values = portfolioValues(account, [position()]);
    expect(values.availableCash).toBe(15_399.35);
    expect(values.optionLiability).toBe(300);
    expect(values.stockMarketValue).toBe(0);
    expect(values.equity).toBe(20_099.35);
    expect(values.unrealizedPnl).toBe(100);
  });

  it("includes stock and short-option marks for covered-call buy-writes", () => {
    const coveredCall = position({
      strategy_type: "covered_call",
      option_type: "call",
      underlying_quantity: 100,
      collateral_reserved: 0,
      entry_underlying_price: 90,
      current_underlying_price: 92,
      entry_option_price: 2,
      current_option_price: 2.5,
      capital_deployed: 9_000
    });
    expect(positionUnrealizedPnl(coveredCall)).toBe(150);
    const values = portfolioValues(account, [coveredCall]);
    expect(values.stockMarketValue).toBe(9_200);
    expect(values.optionLiability).toBe(250);
    expect(values.equity).toBe(29_349.35);
  });

  it("calculates the 7-DTE time boundary deterministically", () => {
    expect(daysToExpiration("2026-08-14", new Date("2026-08-07T20:00:00.000Z"))).toBe(7);
  });

  it("prioritizes the whole-position risk stop over option decay", () => {
    const reason = determinePaperCloseReason(
      position({ strategy_type: "covered_call", option_type: "call", underlying_quantity: 100 }),
      1.5,
      -500,
      null,
      new Date("2026-08-07T20:00:00.000Z")
    );
    expect(reason).toBe("Whole-position loss reached the 8% capital stop");
  });

  it("closes profitable short premium at 50% of the entry credit", () => {
    const reason = determinePaperCloseReason(
      position(),
      2,
      200,
      null,
      new Date("2026-08-07T20:00:00.000Z")
    );
    expect(reason).toBe("50% premium profit target reached");
  });
});
