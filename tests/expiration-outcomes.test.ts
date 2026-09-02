import { describe, expect, it } from "vitest";
import {
  evaluateExpirationOutcome,
  isEasternSettlementWindow,
  weekEndingFriday
} from "@/lib/trading/expiration-outcomes";

describe("expiration outcome evaluation", () => {
  it("marks an out-of-the-money cash-secured put as safely expired", () => {
    const outcome = evaluateExpirationOutcome({
      strategyType: "cash_secured_put",
      underlyingEntryPrice: 100,
      expirationPrice: 94,
      strikePrice: 90,
      optionCreditPerShare: 2
    });

    expect(outcome.assignmentStatus).toBe("expired_without_assignment");
    expect(outcome.assignmentAvoided).toBe(true);
    expect(outcome.premiumReceived).toBe(200);
    expect(outcome.intrinsicValue).toBe(0);
    expect(outcome.modeledPnl).toBe(200);
    expect(outcome.breakevenPrice).toBe(88);
  });

  it("separates put assignment from profitability after premium", () => {
    const outcome = evaluateExpirationOutcome({
      strategyType: "cash_secured_put",
      underlyingEntryPrice: 100,
      expirationPrice: 89,
      strikePrice: 90,
      optionCreditPerShare: 2
    });

    expect(outcome.assignmentStatus).toBe("put_assigned");
    expect(outcome.assignmentAvoided).toBe(false);
    expect(outcome.intrinsicValue).toBe(100);
    expect(outcome.modeledPnl).toBe(100);
  });

  it("marks a covered call above strike as called away and includes the shares", () => {
    const outcome = evaluateExpirationOutcome({
      strategyType: "covered_call",
      underlyingEntryPrice: 100,
      expirationPrice: 112,
      strikePrice: 110,
      optionCreditPerShare: 2
    });

    expect(outcome.assignmentStatus).toBe("shares_called_away");
    expect(outcome.assignmentAvoided).toBe(false);
    expect(outcome.intrinsicValue).toBe(200);
    expect(outcome.modeledPnl).toBe(1200);
  });

  it("does not model assignment when the stock closes exactly at strike", () => {
    const outcome = evaluateExpirationOutcome({
      strategyType: "covered_call",
      underlyingEntryPrice: 100,
      expirationPrice: 110,
      strikePrice: 110,
      optionCreditPerShare: 2
    });

    expect(outcome.assignmentStatus).toBe("expired_without_assignment");
    expect(outcome.assignmentAvoided).toBe(true);
  });
});

describe("weekly expiration reports", () => {
  it("groups midweek expirations into the following Friday", () => {
    expect(weekEndingFriday("2026-09-16")).toBe("2026-09-18");
    expect(weekEndingFriday("2026-09-18")).toBe("2026-09-18");
  });

  it("admits the 4:30 PM Eastern job in daylight and standard time", () => {
    expect(isEasternSettlementWindow(new Date("2026-09-18T20:30:00Z"))).toBe(true);
    expect(isEasternSettlementWindow(new Date("2026-12-18T21:30:00Z"))).toBe(true);
    expect(isEasternSettlementWindow(new Date("2026-09-18T21:30:00Z"))).toBe(false);
  });
});
