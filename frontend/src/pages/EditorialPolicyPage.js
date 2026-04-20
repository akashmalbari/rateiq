export default function EditorialPolicyPage() {
  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-6">Editorial Policy & Methodology</h1>
        <p className="text-slate-300 text-lg leading-relaxed mb-8">
          Our goal is to publish practical, transparent financial education content. We focus on clarity, assumptions,
          and reproducible calculations over hype.
        </p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Content standards</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Original, decision-focused educational content.</li>
              <li>Plain-language explanations of assumptions and limitations.</li>
              <li>Regular updates when market context or product assumptions materially change.</li>
            </ul>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Calculator methodology</h2>
            <p>
              Calculator outputs are generated from user inputs and published formulas shown or described on each page.
              Results are estimates and should be validated independently before making major financial decisions.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Data sources</h2>
            <p>
              Public market and rate pages use third-party data providers (for example FRED and Finnhub where noted).
              Source timeliness and publication lags can affect displayed values.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Corrections</h2>
            <p>
              If you find an error, email <a className="text-amber-400 hover:text-amber-300" href="mailto:hello@figuremymoney.com">hello@figuremymoney.com</a> with the page URL and issue details.
              We review and correct factual errors as quickly as possible.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
