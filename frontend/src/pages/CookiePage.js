export default function CookiePage() {
  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-6">Cookie Policy</h1>
        <p className="text-slate-400 leading-relaxed mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device that help websites remember preferences,
              measure performance, and support features such as analytics and advertising.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">How we use cookies</h2>
            <p>
              We use cookies and similar technologies for analytics, site reliability, and ad delivery.
              Some third-party services may set their own cookies when you use our site.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Managing cookies</h2>
            <p>
              You can control cookies through your browser settings. Disabling cookies may affect some site functionality.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
