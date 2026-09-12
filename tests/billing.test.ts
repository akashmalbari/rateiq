import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  subscriptionIsActive,
  subscriptionPeriodEnd,
  stripeTimestamp
} from "@/lib/billing/service";
import {
  type StripeSubscription,
  verifyStripeWebhookSignature
} from "@/lib/billing/stripe";

function subscription(periods: number[]): StripeSubscription {
  return {
    id: "sub_test",
    customer: "cus_test",
    status: "active",
    metadata: { user_id: "user-1", tier: "premium" },
    canceled_at: null,
    trial_end: null,
    items: {
      data: periods.map((current_period_end, index) => ({
        id: `si_${index}`,
        current_period_end,
        price: { id: `price_${index}` }
      }))
    }
  };
}

describe("billing lifecycle", () => {
  it("only treats paid and trial subscriptions as active", () => {
    expect(subscriptionIsActive("active")).toBe(true);
    expect(subscriptionIsActive("trialing")).toBe(true);
    expect(subscriptionIsActive("past_due")).toBe(false);
    expect(subscriptionIsActive("canceled")).toBe(false);
  });

  it("uses the latest item period for modern Stripe subscriptions", () => {
    expect(subscriptionPeriodEnd(subscription([1_800_000_000, 1_900_000_000]))).toBe(1_900_000_000);
    expect(stripeTimestamp(1_900_000_000)).toBe("2030-03-17T17:46:40.000Z");
  });

  it("accepts a valid Stripe signature and rejects tampering or stale delivery", () => {
    const body = JSON.stringify({ id: "evt_test" });
    const secret = "whsec_test";
    const timestamp = 1_800_000_000;
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`, "utf8")
      .digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    expect(verifyStripeWebhookSignature(body, header, secret, timestamp)).toBe(true);
    expect(verifyStripeWebhookSignature(`${body} `, header, secret, timestamp)).toBe(false);
    expect(verifyStripeWebhookSignature(body, header, secret, timestamp + 301)).toBe(false);
  });
});
