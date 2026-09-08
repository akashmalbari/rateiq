import { createHmac, timingSafeEqual } from "node:crypto";
import { requireServerEnv } from "@/lib/env";

const STRIPE_API_URL = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2025-06-30.basil";

type StripePrimitive = string | number | boolean | null | undefined;
type StripeParams = Record<string, StripePrimitive>;

export type StripeCustomer = {
  id: string;
  email: string | null;
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  customer: string | StripeCustomer | null;
  subscription: string | StripeSubscription | null;
  client_reference_id: string | null;
  metadata: Record<string, string>;
};

export type StripeSubscription = {
  id: string;
  customer: string | StripeCustomer;
  status: string;
  metadata: Record<string, string>;
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  canceled_at: number | null;
  trial_end: number | null;
  items: {
    data: Array<{
      current_period_end?: number;
      price: { id: string };
    }>;
  };
};

export type StripeCoupon = {
  id: string;
  percent_off: number | null;
  duration: "once" | "forever" | "repeating";
};

export type StripePromotionCode = {
  id: string;
  active: boolean;
  code: string;
  max_redemptions: number | null;
  expires_at: number | null;
  times_redeemed: number;
  coupon: StripeCoupon;
};

export type StripeEvent = {
  id: string;
  type: string;
  created: number;
  data: { object: unknown };
};

function objectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export { objectId as stripeObjectId };

async function stripeRequest<T>(
  path: string,
  options: { method?: "GET" | "POST" | "DELETE"; params?: StripeParams } = {}
) {
  const method = options.method ?? "GET";
  const params = new URLSearchParams();
  Object.entries(options.params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });

  const query = method === "GET" && params.size ? `?${params.toString()}` : "";
  const response = await fetch(`${STRIPE_API_URL}${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${requireServerEnv("STRIPE_SECRET_KEY")}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(method === "POST"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {})
    },
    body: method === "POST" ? params.toString() : undefined,
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload as { error?: { message?: string } }).error?.message;
    throw new Error(message ?? `Stripe request failed with status ${response.status}.`);
  }
  return payload as T;
}

export function createStripeCustomer(user: { id: string; email?: string | null }) {
  return stripeRequest<StripeCustomer>("/customers", {
    method: "POST",
    params: {
      email: user.email,
      "metadata[user_id]": user.id
    }
  });
}

export function createStripeCheckoutSession(input: {
  userId: string;
  customerId: string;
  plan: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    params: {
      mode: "subscription",
      customer: input.customerId,
      client_reference_id: input.userId,
      "line_items[0][price]": input.priceId,
      "line_items[0][quantity]": 1,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      "metadata[user_id]": input.userId,
      "metadata[tier]": input.plan,
      "subscription_data[metadata][user_id]": input.userId,
      "subscription_data[metadata][tier]": input.plan
    }
  });
}

export function createStripePortalSession(customerId: string, returnUrl: string) {
  return stripeRequest<{ id: string; url: string }>("/billing_portal/sessions", {
    method: "POST",
    params: { customer: customerId, return_url: returnUrl }
  });
}

export function retrieveStripeSubscription(subscriptionId: string) {
  return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`);
}

export function createStripeCoupon(input: {
  name: string;
  percentOff: number;
  duration: "once" | "forever";
  adminUserId: string;
}) {
  return stripeRequest<StripeCoupon>("/coupons", {
    method: "POST",
    params: {
      name: input.name,
      percent_off: input.percentOff,
      duration: input.duration,
      "metadata[created_by]": input.adminUserId,
      "metadata[source]": "figure_my_money_admin"
    }
  });
}

export function deleteStripeCoupon(couponId: string) {
  return stripeRequest<{ id: string; deleted: boolean }>(`/coupons/${couponId}`, {
    method: "DELETE"
  });
}

export function createStripePromotionCode(input: {
  couponId: string;
  code: string;
  maxRedemptions?: number;
  expiresAt?: number;
}) {
  return stripeRequest<StripePromotionCode>("/promotion_codes", {
    method: "POST",
    params: {
      "promotion[type]": "coupon",
      "promotion[coupon]": input.couponId,
      code: input.code,
      max_redemptions: input.maxRedemptions,
      expires_at: input.expiresAt
    }
  });
}

export function deactivateStripePromotionCode(promotionCodeId: string) {
  return stripeRequest<StripePromotionCode>(`/promotion_codes/${promotionCodeId}`, {
    method: "POST",
    params: { active: false }
  });
}

export function listStripePromotionCodes(limit = 100) {
  return stripeRequest<{ data: StripePromotionCode[] }>("/promotion_codes", {
    params: { limit }
  });
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const fields = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = Number(fields.find(([key]) => key === "t")?.[1]);
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 300 || !signatures.length) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest();

  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const actual = Buffer.from(signature, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}
