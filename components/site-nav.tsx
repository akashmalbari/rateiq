import Link from "next/link";
import { Activity, LockKeyhole, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/backtests", label: "Backtests" },
  { href: "/admin", label: "Admin" },
  { href: "/pricing", label: "Pricing" }
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0E14]/86 backdrop-blur-xl">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" data-testid="site-logo-link">
          <span className="flex size-9 items-center justify-center rounded-md border border-amber-300/30 bg-amber-300/10">
            <Activity className="size-5 text-amber-300" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-extrabold tracking-normal text-white">
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

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">
              <LockKeyhole aria-hidden="true" />
              Login
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">
              <UserRound aria-hidden="true" />
              Start
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
