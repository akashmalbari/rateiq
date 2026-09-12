import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ requireServerEnv: () => "sk_test_admin" }));

import {
  changeStripeSubscriptionPrice,
  scheduleStripeSubscriptionCancellation,
  type StripeSubscription
} from "@/lib/billing/stripe";

const subscription: StripeSubscription = {
  id: "sub_admin_test",
  customer: "cus_admin_test",
  status: "active",
  metadata: { tier: "essential" },
  cancel_at_period_end: false,
  canceled_at: null,
  trial_end: null,
  items: {
    data: [
      {
        id: "si_admin_test",
        current_period_end: 1_900_000_000,
        quantity: 1,
        price: { id: "price_essential" }
      }
    ]
  }
};

afterEach(() => vi.unstubAllGlobals());

describe("Stripe administrator controls", () => {
  it("replaces the subscription item without creating a proration", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(subscription), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await changeStripeSubscriptionPrice(subscription, {
      priceId: "price_premium",
      plan: "premium"
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(String(options.body));
    expect(body.get("items[0][id]")).toBe("si_admin_test");
    expect(body.get("items[0][price]")).toBe("price_premium");
    expect(body.get("proration_behavior")).toBe("none");
    expect(body.get("metadata[tier]")).toBe("premium");
  });

  it("schedules cancellation at period end instead of canceling immediately", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...subscription, cancel_at_period_end: true }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await scheduleStripeSubscriptionCancellation(subscription.id);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(String(options.body));
    expect(options.method).toBe("POST");
    expect(body.get("cancel_at_period_end")).toBe("true");
  });
});
