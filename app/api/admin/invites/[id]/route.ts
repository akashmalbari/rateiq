import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("premium_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "Invitation was not found or is already revoked." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation could not be revoked.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Admin") ? 403 : 400 }
    );
  }
}
