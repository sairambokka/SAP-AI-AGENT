import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-sky-200 bg-sky-50 text-sky-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
};

export function RiskBadge({ value }: { value?: string }) {
  const key = (value || "unknown").toLowerCase();
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase", styles[key] || styles.unknown)}>
      {value || "Unknown"}
    </span>
  );
}
