import { adminEmails, isSupabaseConfigured } from "@/lib/env";
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

export async function requireAdmin() {
  const user = await requireUser();
  const email = user.email?.toLowerCase() ?? "";

  if (adminEmails.includes(email)) {
    return user;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (data?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}
