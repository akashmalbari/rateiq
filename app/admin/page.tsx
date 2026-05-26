import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { AdminConsole } from "@/app/admin/admin-console";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-10">
        <AdminConsole />
      </main>
      <SiteFooter />
    </div>
  );
}
