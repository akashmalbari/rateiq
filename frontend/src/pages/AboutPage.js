import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-6">About FigureMyMoney</h1>
        <p className="text-lg text-slate-300 leading-relaxed mb-8">
          FigureMyMoney is an educational finance website built to help people compare real-life money decisions with transparent assumptions.
          Our calculators and market pages are designed to show tradeoffs clearly so you can make better-informed decisions.
        </p>

        <div className="space-y-6 text-slate-400 leading-relaxed">
          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">What we publish</h2>
            <p>
              We publish practical calculators, market context, and decision-focused articles across housing, debt management,
              retirement planning, and investing fundamentals.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">How our tools work</h2>
            <p>
              Each tool uses clearly labeled assumptions (rates, time horizons, taxes, growth estimates, etc.). Results are scenario estimates,
              not predictions. You can adjust all major inputs to match your own situation.
            </p>
          </section>

          <section className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading text-2xl text-slate-100 mb-3">Important disclaimer</h2>
            <p>
              FigureMyMoney is for informational and educational purposes only and does not provide personalized financial, legal, tax,
              or investment advice.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/contact" className="bg-amber-500 text-[#0B0E14] font-semibold rounded-lg px-5 py-2.5 hover:bg-amber-400 transition-colors">
            Contact us
          </Link>
          <Link to="/editorial-policy" className="bg-white/5 border border-white/10 text-slate-200 rounded-lg px-5 py-2.5 hover:bg-white/10 transition-colors">
            Read editorial policy
          </Link>
        </div>
      </div>
    </div>
  );
}
