"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BackendStatus } from "@/components/layout/backend-status";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/runs", label: "Runs" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-grid">
      <header className="relative z-20 border-b border-slate-300/70 bg-gradient-to-b from-white to-slate-50/90 shadow-sm backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="space-y-2">
            <h1 className="relative inline-block pb-1 text-3xl font-extrabold tracking-tight text-sap-700 sm:text-4xl">
              SAP HANA Insights Command Center
              <span className="absolute -bottom-0.5 left-0 h-1 w-20 rounded bg-sap-500" />
            </h1>
            <p className="text-sm text-slate-600">Run AI agents, pull from HANA-first data, and trace every execution.</p>
            <nav className="flex flex-wrap items-center gap-2 pt-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "btn-secondary",
                    pathname === item.href
                      ? "border-sap-500 bg-sap-600 text-white shadow-md hover:bg-sap-700"
                      : "",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">HANA Preferred</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">API Fallback</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">Run Tracking Enabled</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <BackendStatus />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
