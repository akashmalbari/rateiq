import type { User } from "@supabase/supabase-js";
import { adminEmails, isSupabaseConfigured, serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";

export async function requireUser() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}

function hasAdminMetadata(user: User) {
  const metadataValues = [
    user.app_metadata?.role,
    user.app_metadata?.user_role,
    user.user_metadata?.role,
    user.user_metadata?.user_role
  ];
  const metadataRoles = [
    ...metadataValues,
    ...(Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : []),
    ...(Array.isArray(user.user_metadata?.roles) ? user.user_metadata.roles : [])
  ];

  return metadataRoles.some((role) => String(role).toLowerCase() === "admin");
}

async function getProfileRole(userId: string) {
  const supabase = serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify admin role: ${error.message}`);
  }

  return data?.role;
}

export async function requireAdmin() {
  const user = await requireUser();
  const email = user.email?.toLowerCase() ?? "";

  if (adminEmails.includes(email)) {
    return user;
  }

  if (hasAdminMetadata(user)) {
    return user;
  }

  const role = await getProfileRole(user.id);
  if (role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}
