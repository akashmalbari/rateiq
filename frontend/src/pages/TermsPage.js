export default function TermsPage() {
  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-6">Terms of Use</h1>
        <p className="text-slate-400 leading-relaxed mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Educational purpose only</h2>
            <p>
              FigureMyMoney content, tools, and calculators are provided for informational and educational purposes only.
              Nothing on this site is financial, tax, legal, or investment advice.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">No guarantees</h2>
            <p>
              Calculator outputs and article examples are estimates based on assumptions and may not reflect real-world outcomes.
              You are responsible for decisions made using this information.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Third-party links</h2>
            <p>
              We may link to third-party websites and services. We are not responsible for third-party content,
              availability, or policies.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Contact</h2>
            <p>
              Questions about these terms can be sent to <a className="text-amber-400 hover:text-amber-300" href="mailto:hello@figuremymoney.com">hello@figuremymoney.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
