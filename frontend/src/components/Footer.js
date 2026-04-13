import { Link } from "react-router-dom";
import { TrendingUp, Twitter, Linkedin, Mail } from "lucide-react";

const CALC_LINKS = [
  { to: "/calculators/rent-vs-buy", label: "Rent vs Buy" },
  { to: "/calculators/mortgage", label: "Mortgage Calculator" },
  { to: "/calculators/car-lease", label: "Car Lease vs Buy" },
  { to: "/calculators/debt-payoff", label: "Debt Payoff" },
  { to: "/calculators/retirement", label: "Retirement Planner" },
  { to: "/calculators/invest-vs-debt", label: "Invest vs Debt" },
  { to: "/calculators/stock-returns", label: "Stock Returns" },
];

export default function Footer() {
  return (
    <footer className="bg-[#080B10] border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#0B0E14]" />
              </div>
              <span className="font-heading font-bold text-slate-100 text-lg">
                Figure<span className="text-amber-500">My</span>Money
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Data-driven financial decision tools. Not advice — just better numbers.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://twitter.com/figuremymoney" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors">
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a href="mailto:hello@figuremymoney.com"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Calculators */}
          <div>
            <h4 className="font-heading font-semibold text-slate-300 text-sm mb-4">Calculators</h4>
            <ul className="space-y-2.5">
              {CALC_LINKS.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-heading font-semibold text-slate-300 text-sm mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li><Link to="/blog" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Financial Blog</Link></li>
              <li><Link to="/markets" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Live Markets</Link></li>
              <li><Link to="/blog/rent-vs-buy-2026" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Rent vs Buy Guide</Link></li>
              <li><Link to="/blog/how-much-to-retire-2026" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Retirement Guide</Link></li>
              <li><Link to="/blog/debt-payoff-avalanche-snowball" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Debt Payoff Guide</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-slate-300 text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-slate-500">Not Financial Advice</span></li>
              <li><span className="text-sm text-slate-500">Privacy Policy</span></li>
              <li><span className="text-sm text-slate-500">Terms of Use</span></li>
              <li><span className="text-sm text-slate-500">Cookie Policy</span></li>
            </ul>
            <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
              <p className="text-xs text-slate-500 leading-relaxed">
                This site may earn a commission from partner links at no extra cost to you.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} FigureMyMoney. For informational purposes only. Not financial advice.
          </p>
          <p className="text-xs text-slate-600">
            Data from FRED, Finnhub. Updated in real-time.
          </p>
        </div>
      </div>
    </footer>
  );
}
