import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (errorCode || errorDescription) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("auth_error", errorCode ?? "auth_error");
    if (errorDescription) {
      loginUrl.searchParams.set("auth_error_description", errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
