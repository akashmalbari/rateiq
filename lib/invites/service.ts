import { publicEnv } from "@/lib/env";
import { createInviteToken, hashInviteToken } from "@/lib/invites/tokens";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createPremiumInvite(input: {
  createdBy: string;
  expiresInDays: number;
  note?: string | null;
}) {
  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("premium_invites")
    .insert({
      token_hash: hashInviteToken(token),
      token_prefix: token.slice(0, 8),
      note: input.note || null,
      expires_at: expiresAt,
      created_by: input.createdBy
    })
    .select("id,token_prefix,note,expires_at,created_at")
    .single();
  if (error) throw new Error(error.message);

  return {
    invite: { ...data, status: "available" as const },
    token,
    url: `${publicEnv.NEXT_PUBLIC_APP_URL}/invite/${token}`
  };
}
