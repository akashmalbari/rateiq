import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { strategyRegistry } from "@/lib/trading/strategies";

export async function GET() {
  try {
    await requireAdmin();
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        strategies: strategyRegistry.map((strategy) => ({
          slug: strategy.type,
          name: strategy.name,
          enabled: strategy.enabledByDefault
        }))
      });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("strategies").select("*").order("name");
    if (error) throw new Error(error.message);
    return NextResponse.json({ strategies: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy settings unavailable." },
      { status: 403 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    if (!isSupabaseConfigured) throw new Error("Supabase is required to update strategies.");
    const body = await request.json();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("strategies")
      .update({
        enabled: body.enabled,
        thresholds: body.thresholds,
        updated_at: new Date().toISOString()
      })
      .eq("slug", body.slug)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ strategy: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy update failed." },
      { status: 400 }
    );
  }
}
