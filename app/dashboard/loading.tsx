import { SiteNav } from "@/components/site-nav";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-8">
        <div className="h-10 w-64 animate-pulse rounded bg-white/10" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
          ))}
        </div>
        <div className="mt-8 h-96 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
      </main>
    </div>
  );
}
