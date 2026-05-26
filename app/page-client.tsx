"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthErrorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code");
  const errorCode = searchParams?.get("error_code");
  const errorDescription = searchParams?.get("error_description");

  useEffect(() => {
    if (code) {
      router.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=/dashboard`);
      return;
    }

    if (!errorCode && !errorDescription) return;

    const params = new URLSearchParams();
    params.set("auth_error", errorCode ?? "auth_error");
    if (errorDescription) {
      params.set("auth_error_description", errorDescription);
    }
    router.replace(`/login?${params.toString()}`);
  }, [code, errorCode, errorDescription, router]);

  return null;
}
