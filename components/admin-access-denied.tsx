import { ShieldAlert } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";

export function AdminAccessDenied({ email }: { email: string }) {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-10">
        <Badge variant="danger">Admin access denied</Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold text-white">Operations Console</h1>
        <div className="mt-6 flex max-w-2xl gap-3 rounded-md border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            Signed in as <span className="font-mono">{email}</span>, but this address is not in the server-side admin allowlist.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
