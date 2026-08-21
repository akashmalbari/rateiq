"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BadgeDollarSign,
  Calculator,
  ChartNoAxesCombined,
  ChevronRight,
  Gauge,
  Menu,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/paper", label: "Paper Portfolio", icon: WalletCards },
  { href: "/backtests", label: "Backtests", icon: ChartNoAxesCombined },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/pricing", label: "Pricing", icon: BadgeDollarSign }
];

export function MobileNav() {
  const pathname = usePathname();
  const currentPath = pathname ?? "";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu aria-hidden="true" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-[70] w-64 rounded-md border border-white/10 bg-[#11161E] p-2 text-slate-100 shadow-2xl shadow-black/50 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="px-3 pb-2 pt-1 data-label">
            Navigation
          </DropdownMenu.Label>
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const active = currentPath === href || currentPath.startsWith(`${href}/`);

            return (
              <DropdownMenu.Item key={href} asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex h-11 cursor-pointer items-center gap-3 rounded px-3 text-sm font-medium outline-none transition-colors focus:bg-white/[0.08]",
                    active
                      ? "bg-amber-300/10 text-amber-200"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="size-4 text-slate-600" aria-hidden="true" />
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
