import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { deactivateStripePromotionCode } from "@/lib/billing/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    const { data: coupon, error } = await supabase
      .from("subscription_coupons")
      .select("stripe_promotion_code_id")
      .eq("id", id)
      .single();
    if (error || !coupon) throw new Error(error?.message ?? "Coupon not found.");

    await deactivateStripePromotionCode(coupon.stripe_promotion_code_id);
    const { error: updateError } = await supabase
      .from("subscription_coupons")
      .update({ active: false })
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coupon could not be deactivated.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Admin") ? 403 : 400 }
    );
  }
}
