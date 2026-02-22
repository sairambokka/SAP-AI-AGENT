"use client";

import { useEffect, useMemo, useState } from "react";

type HealthState = "checking" | "online" | "offline";

export function BackendStatus() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [state, setState] = useState<HealthState>("checking");

  useEffect(() => {
    let active = true;

    async function check() {
      if (!apiBase) {
        if (active) setState("offline");
        return;
      }

      try {
        const response = await fetch(`${apiBase}/health`, { cache: "no-store" });
        if (!active) return;
        setState(response.ok ? "online" : "offline");
      } catch {
        if (!active) return;
        setState("offline");
      }
    }

    check();
    const interval = window.setInterval(check, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [apiBase]);

  const style = useMemo(() => {
    if (state === "online") {
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
        label: "Backend online",
      };
    }

    if (state === "offline") {
      return {
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        dot: "bg-rose-500",
        label: "Backend offline",
      };
    }

    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      label: "Checking backend",
    };
  }, [state]);

  return (
    <div className={`min-w-56 rounded-xl border px-3 py-2 text-xs shadow-sm ${style.badge}`}>
      <div className="flex items-center gap-2 font-semibold">
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        {style.label}
      </div>
      <p className="mt-1 font-mono">{apiBase || "NEXT_PUBLIC_API_BASE_URL missing"}</p>
    </div>
  );
}
