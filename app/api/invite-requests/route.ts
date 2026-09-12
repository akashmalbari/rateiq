import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  company: z.string().max(0).optional()
});

const acceptedResponse = {
  success: true,
  message: "Request received. Watch your inbox for an invitation from Figure My Money."
};

export async function POST(request: Request) {
  const limit = rateLimit(`invite-request:${getClientIp(request)}`, 5, 60 * 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    if (!isSupabaseConfigured) throw new Error("Invitation requests are temporarily unavailable.");
    const input = requestSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("invite_requests").insert({ email: input.email });

    // A duplicate open request receives the same response to avoid exposing stored addresses.
    if (error && error.code !== "23505") throw new Error(error.message);
    return NextResponse.json(acceptedResponse, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invitation request could not be submitted." },
      { status: 503 }
    );
  }
}
