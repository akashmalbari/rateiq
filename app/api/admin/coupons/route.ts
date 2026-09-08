import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import {
  createStripeCoupon,
  createStripePromotionCode,
  deactivateStripePromotionCode,
  deleteStripeCoupon,
  listStripePromotionCodes
} from "@/lib/billing/stripe";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,24}$/),
  percentOff: z.coerce.number().positive().max(100),
  duration: z.enum(["once", "forever"]),
  maxRedemptions: z.coerce.number().int().positive().max(100_000).optional(),
  expiresAt: z.string().datetime().optional()
});

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("subscription_coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const localCoupons = data ?? [];
    const stripeCodes = await listStripePromotionCodes();
    const stripeById = new Map(stripeCodes.data.map((code) => [code.id, code]));
    const coupons = localCoupons.map((coupon) => {
      const live = stripeById.get(coupon.stripe_promotion_code_id);
      return live
        ? { ...coupon, active: live.active, times_redeemed: live.times_redeemed }
        : coupon;
    });
    await Promise.all(
      coupons
        .filter((coupon, index) =>
          coupon.active !== localCoupons[index].active ||
          coupon.times_redeemed !== localCoupons[index].times_redeemed
        )
        .map((coupon) =>
          supabase
            .from("subscription_coupons")
            .update({ active: coupon.active, times_redeemed: coupon.times_redeemed })
            .eq("id", coupon.id)
        )
    );
    return NextResponse.json({ coupons });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Coupons unavailable." },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  const limit = rateLimit(`admin-coupons:${getClientIp(request)}`, 10, 10 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const user = await requireAdmin();
    const input = couponSchema.parse(await request.json());
    const expiresAt = input.expiresAt
      ? Math.floor(new Date(input.expiresAt).getTime() / 1000)
      : undefined;
    if (expiresAt && expiresAt <= Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: "Expiration must be in the future." }, { status: 400 });
    }

    const coupon = await createStripeCoupon({
      name: `${input.code} - ${input.percentOff}% off`,
      percentOff: input.percentOff,
      duration: input.duration,
      adminUserId: user.id
    });

    let promotion;
    try {
      promotion = await createStripePromotionCode({
        couponId: coupon.id,
        code: input.code,
        maxRedemptions: input.maxRedemptions,
        expiresAt
      });
    } catch (error) {
      await deleteStripeCoupon(coupon.id).catch(() => null);
      throw error;
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("subscription_coupons")
      .insert({
        code: promotion.code,
        percent_off: input.percentOff,
        duration: input.duration,
        max_redemptions: promotion.max_redemptions,
        expires_at: promotion.expires_at
          ? new Date(promotion.expires_at * 1000).toISOString()
          : null,
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promotion.id,
        active: promotion.active,
        times_redeemed: promotion.times_redeemed,
        created_by: user.id
      })
      .select("*")
      .single();
    if (error) {
      await deactivateStripePromotionCode(promotion.id).catch(() => null);
      throw new Error(error.message);
    }
    return NextResponse.json({ coupon: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coupon could not be created.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Admin") ? 403 : 400 }
    );
  }
}
