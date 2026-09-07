"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChartNoAxesCombined,
  ChevronDown,
  Trophy,
  WalletCards
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const performanceItems = [
  {
    href: "/track-record",
    label: "Track Record",
    description: "Expiration outcomes",
    icon: Trophy
  },
  {
    href: "/paper",
    label: "Paper Portfolio",
    description: "Forward-tested positions",
    icon: WalletCards
  },
  {
    href: "/backtests",
    label: "Backtests",
    description: "Historical simulations",
    icon: ChartNoAxesCombined
  }
];

export function PerformanceNavMenu() {
  const pathname = usePathname() ?? "";
  const active = performanceItems.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(active && "bg-white/[0.06] text-white")}
        >
          Performance
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          sideOffset={10}
          className="z-[70] w-64 rounded-md border border-white/10 bg-[#11161E] p-2 text-slate-100 shadow-2xl shadow-black/50 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="px-3 pb-2 pt-1 data-label">
            Performance
          </DropdownMenu.Label>
          {performanceItems.map(({ href, label, description, icon: Icon }) => {
            const itemActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <DropdownMenu.Item key={href} asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded px-3 py-2.5 outline-none transition-colors focus:bg-white/[0.08]",
                    itemActive
                      ? "bg-amber-300/10 text-amber-200"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
                  </span>
                </Link>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
