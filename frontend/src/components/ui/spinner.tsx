import { cn } from "@/lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-label={label}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sap-600" />
      <span className="text-sm text-slate-600">{label}</span>
    </span>
  );
}
