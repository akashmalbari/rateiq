import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdmin();
    if (!isSupabaseConfigured) {
      return NextResponse.json({ logs: [] });
    }

    const supabase = createSupabaseAdminClient();
    const [{ data: scans }, { data: emails }] = await Promise.all([
      supabase.from("scans").select("*").order("started_at", { ascending: false }).limit(20),
      supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(20)
    ]);

    return NextResponse.json({ scans: scans ?? [], emails: emails ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin logs unavailable." },
      { status: 403 }
    );
  }
}
