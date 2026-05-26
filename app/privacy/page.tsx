import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <SiteNav />
      <main className="container-shell max-w-4xl py-16">
        <h1 className="font-heading text-4xl font-bold text-white">Privacy</h1>
        <p className="mt-6 text-sm leading-7 text-slate-400">
          Figure My Money stores account, subscription, email delivery, scan, and
          product usage data needed to operate the platform. Authentication and
          database services are handled by Supabase, and emails are delivered
          through Resend. Do not enter brokerage credentials or sensitive personal
          financial account information.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
