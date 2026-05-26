"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthErrorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams?.get("error_code");
  const errorDescription = searchParams?.get("error_description");

  useEffect(() => {
    if (!errorCode && !errorDescription) return;

    const params = new URLSearchParams();
    params.set("auth_error", errorCode ?? "auth_error");
    if (errorDescription) {
      params.set("auth_error_description", errorDescription);
    }
    router.replace(`/login?${params.toString()}`);
  }, [errorCode, errorDescription, router]);

  return null;
}
