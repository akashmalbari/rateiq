import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "neutral" | "green" | "amber" | "blue" | "red";
}) {
  const toneClass = {
    neutral: "text-slate-100",
    green: "text-emerald-300",
    amber: "text-amber-300",
    blue: "text-sky-300",
    red: "text-rose-300"
  }[tone];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <p className="data-label">{label}</p>
      <p className={cn("mt-2 font-heading text-2xl font-bold", toneClass)}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}
