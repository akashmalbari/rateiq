"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function PaperEquityChart({
  data
}: {
  data: Array<{ date: string; equity: number; realized: number }>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-72 animate-pulse rounded-md bg-white/[0.04]" />;
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-500">
        The first equity mark will appear after the next automated cycle.
      </div>
    );
  }

  return (
    <div className="h-72 w-full" data-testid="paper-equity-chart">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="paper-equity" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
          <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
          />
          <Tooltip
            formatter={(value) => [
              `$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
              "Equity"
            ]}
            contentStyle={{
              background: "#101722",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 8,
              color: "#e2e8f0"
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#34d399"
            fill="url(#paper-equity)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
