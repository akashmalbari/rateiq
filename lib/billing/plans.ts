import { serverEnv } from "@/lib/env";

export const BILLING_PLANS = {
  essential: {
    id: "essential",
    name: "Essential",
    price: 6.99,
    priceId: serverEnv.STRIPE_ESSENTIAL_PRICE_ID
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 11.99,
    priceId: serverEnv.STRIPE_PREMIUM_PRICE_ID
  }
} as const;

export type BillingPlanId = keyof typeof BILLING_PLANS;

export function isBillingPlanId(value: unknown): value is BillingPlanId {
  return value === "essential" || value === "premium";
}

export function planFromPriceId(priceId: string | null | undefined) {
  if (!priceId) return null;
  return Object.values(BILLING_PLANS).find((plan) => plan.priceId === priceId)?.id ?? null;
}

export function requirePlanPriceId(planId: BillingPlanId) {
  const priceId = BILLING_PLANS[planId].priceId;
  if (!priceId) {
    throw new Error(`Stripe price is not configured for ${BILLING_PLANS[planId].name}.`);
  }
  return priceId;
}
