import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  P0: "border-blue-600 bg-blue-600 text-white",
  P1: "border-blue-300 bg-blue-100 text-blue-800",
  P2: "border-slate-300 bg-white text-slate-700",
};

export function PriorityBadge({ value }: { value?: string }) {
  const key = value || "P2";
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold", styles[key] || styles.P2)}>{key}</span>;
}
