import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
  failure: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase", styles[status] || "border-slate-200 bg-slate-50 text-slate-700")}>
      {status}
    </span>
  );
}
