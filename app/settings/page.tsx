import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SettingsForm } from "@/app/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell py-10">
        <SettingsForm />
      </main>
      <SiteFooter />
    </div>
  );
}
