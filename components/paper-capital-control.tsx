"use client";

import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function PaperCapitalControl({
  availableCash,
  netContributions
}: {
  availableCash: number;
  netContributions: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("5000");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function adjust(direction: "contribution" | "withdrawal") {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setStatus("Enter a positive dollar amount.");
      return;
    }

    setIsLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/paper/capital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, direction })
      });
      const body = (await response.json()) as { cashBalance?: number; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Capital adjustment failed.");
      setStatus(`${direction === "contribution" ? "Added" : "Withdrew"} ${money(numericAmount)}.`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Capital adjustment failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-8 border-y border-white/10 py-5" aria-label="Paper capital controls">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="data-label">Paper Account Capital</p>
          <p className="mt-2 text-sm text-slate-400">
            Available cash {money(availableCash)} · Net funding {netContributions >= 0 ? "+" : ""}{money(netContributions)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            aria-label="Paper capital adjustment amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="100"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full font-mono sm:w-40"
          />
          <Button type="button" onClick={() => adjust("contribution")} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
            Add capital
          </Button>
          <Button type="button" variant="secondary" onClick={() => adjust("withdrawal")} disabled={isLoading}>
            <Minus aria-hidden="true" />
            Withdraw
          </Button>
        </div>
      </div>
      {status ? <p className="mt-3 text-sm text-slate-300" role="status">{status}</p> : null}
    </section>
  );
}
