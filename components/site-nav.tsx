import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthNavActions } from "@/components/auth-nav-actions";
import { MobileNav } from "@/components/mobile-nav";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/paper", label: "Paper Portfolio" },
  { href: "/backtests", label: "Backtests" },
  { href: "/calculators", label: "Calculators" },
  { href: "/admin", label: "Admin" },
  { href: "/pricing", label: "Pricing" }
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0E14]/86 backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3" data-testid="site-logo-link">
          <span className="flex size-8 items-center justify-center rounded-md border border-amber-300/30 bg-amber-300/10 sm:size-9">
            <Activity className="size-5 text-amber-300" aria-hidden="true" />
          </span>
          <span className="whitespace-nowrap font-heading text-base font-extrabold tracking-normal text-white sm:text-lg">
            Figure My Money
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <MobileNav />
          <AuthNavActions />
        </div>
      </div>
    </header>
  );
}
