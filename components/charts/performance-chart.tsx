"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Recommendation } from "@/lib/trading/types";

const tooltipStyle = {
  background: "#101722",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 8,
  color: "#e2e8f0"
};

function ChartMount({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-72 w-full animate-pulse rounded-lg bg-white/[0.04]" />;
  }

  return children;
}

export function ConfidenceChart({ recommendations }: { recommendations: Recommendation[] }) {
  const data = recommendations.map((item) => ({
    symbol: item.symbol,
    confidence: item.confidenceScore,
    probability: item.probabilityOfProfit,
    liquidity: item.liquidityScore
  }));

  return (
    <ChartMount>
      <div className="h-72 w-full" data-testid="confidence-chart">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="symbol" stroke="#64748b" tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,.04)" }} />
            <Bar dataKey="confidence" fill="#fbbf24" radius={[6, 6, 0, 0]} />
            <Bar dataKey="probability" fill="#34d399" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartMount>
  );
}

export function EquityCurveChart() {
  const data = Array.from({ length: 18 }, (_, index) => {
    const equity = 100000 + index * 1650 + Math.sin(index * 1.4) * 1800;
    return { label: `W${index + 1}`, equity: Math.round(equity) };
  });

  return (
    <ChartMount>
      <div className="h-72 w-full" data-testid="equity-curve-chart">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equity" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="equity" stroke="#34d399" fill="url(#equity)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartMount>
  );
}
