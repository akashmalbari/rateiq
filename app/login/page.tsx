import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteNav } from "@/components/site-nav";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-lg bg-white/10" />}>
          <AuthForm mode="login" />
        </Suspense>
      </main>
    </div>
  );
}
