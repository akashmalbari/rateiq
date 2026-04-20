export default function PrivacyPage() {
  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-6">Privacy Policy</h1>
        <p className="text-slate-400 leading-relaxed mb-8">
          Last updated: April 2026
        </p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Information we collect</h2>
            <p>
              We may collect limited personal information you provide directly (for example, newsletter email submissions)
              and basic technical analytics data used to improve site performance.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">How we use data</h2>
            <p>
              We use collected information to operate the site, send requested communications, maintain security,
              and improve content quality and user experience.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Advertising and cookies</h2>
            <p>
              Third-party vendors, including Google, may use cookies to serve ads based on your prior visits to this and other websites.
              You can learn more in our Cookie Policy and Google’s ad settings.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Contact</h2>
            <p>
              For privacy questions, contact us at <a className="text-amber-400 hover:text-amber-300" href="mailto:hello@figuremymoney.com">hello@figuremymoney.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
