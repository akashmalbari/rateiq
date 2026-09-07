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

export class PremiumAccessRequiredError extends Error {
  constructor() {
    super("Premium access required.");
    this.name = "PremiumAccessRequiredError";
  }
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

async function getProfileAccess(userId: string) {
  const supabase = serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("role,subscription_tier")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify account access: ${error.message}`);
  }

  return data;
}

export function profileHasPremiumAccess(profile: {
  role?: string | null;
  subscription_tier?: string | null;
}) {
  return (
    profile.role === "admin" ||
    profile.subscription_tier === "premium" ||
    profile.subscription_tier === "enterprise"
  );
}

export async function getUserAccess(user: User) {
  const email = user.email?.toLowerCase() ?? "";
  const metadataAdmin = hasAdminMetadata(user);
  const configuredAdmin = adminEmails.includes(email);
  const profile = await getProfileAccess(user.id);
  const isAdmin = configuredAdmin || metadataAdmin || profile?.role === "admin";
  return {
    isAdmin,
    hasPremiumAccess: isAdmin || profileHasPremiumAccess(profile ?? {}),
    subscriptionTier: profile?.subscription_tier ?? "essential"
  };
}

export async function requirePremium() {
  const user = await requireUser();
  const access = await getUserAccess(user);
  if (!access.hasPremiumAccess) throw new PremiumAccessRequiredError();
  return user;
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

  const profile = await getProfileAccess(user.id);
  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}
