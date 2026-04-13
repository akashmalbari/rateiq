import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, TrendingUp, ChevronDown } from "lucide-react";

const CALC_LINKS = [
  { to: "/calculators/rent-vs-buy", label: "Rent vs Buy" },
  { to: "/calculators/mortgage", label: "Mortgage" },
  { to: "/calculators/car-lease", label: "Car Lease" },
  { to: "/calculators/debt-payoff", label: "Debt Payoff" },
  { to: "/calculators/retirement", label: "Retirement" },
  { to: "/calculators/invest-vs-debt", label: "Invest vs Debt" },
  { to: "/calculators/stock-returns", label: "Stock Returns" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); setCalcOpen(false); }, [pathname]);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${isActive ? "text-amber-500" : "text-slate-400 hover:text-slate-100"}`;

  return (
    <header
      data-testid="navbar"
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0B0E14]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06)]" : "bg-[#0B0E14]/80 backdrop-blur-md"} border-b border-white/5`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" data-testid="nav-logo">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center group-hover:bg-amber-400 transition-colors">
              <TrendingUp className="w-4 h-4 text-[#0B0E14]" />
            </div>
            <span className="font-heading font-bold text-slate-100 text-lg tracking-tight">
              Figure<span className="text-amber-500">My</span>Money
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {/* Calculators dropdown */}
            <div className="relative" onMouseEnter={() => setCalcOpen(true)} onMouseLeave={() => setCalcOpen(false)}>
              <button className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
                Calculators <ChevronDown className={`w-3.5 h-3.5 transition-transform ${calcOpen ? "rotate-180" : ""}`} />
              </button>
              {calcOpen && (
                <div className="absolute top-full left-0 pt-2 w-52 z-50">
                  <div className="bg-[#151A22] border border-white/10 rounded-xl p-2 shadow-2xl">
                    {CALC_LINKS.map(l => (
                      <Link key={l.to} to={l.to}
                        className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors">
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/markets" className={linkClass} data-testid="nav-markets">Markets</NavLink>
            <NavLink to="/blog" className={linkClass} data-testid="nav-blog">Blog</NavLink>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/calculators" data-testid="nav-cta"
              className="bg-amber-500 text-[#0B0E14] font-semibold text-sm rounded-lg px-4 py-2 hover:bg-amber-400 transition-all active:scale-95">
              Start Free
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            data-testid="mobile-menu-toggle"
            className="md:hidden text-slate-400 hover:text-slate-100 p-1.5"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[#0D1117] border-t border-white/5" data-testid="mobile-menu">
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Calculators</p>
            {CALC_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className="block px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5">
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-white/5 my-2" />
            <Link to="/markets" className="block px-3 py-2.5 text-sm text-slate-400 hover:text-slate-100">Markets</Link>
            <Link to="/blog" className="block px-3 py-2.5 text-sm text-slate-400 hover:text-slate-100">Blog</Link>
            <div className="pt-3">
              <Link to="/calculators"
                className="block w-full text-center bg-amber-500 text-[#0B0E14] font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-amber-400">
                Start Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
