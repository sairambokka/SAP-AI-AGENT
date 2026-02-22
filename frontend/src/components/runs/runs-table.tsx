"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AgentRun } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export function RunsTable({ runs }: { runs: AgentRun[] }) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...runs].sort((a, b) => {
      const x = +new Date(a.createdAt);
      const y = +new Date(b.createdAt);
      return sortDir === "asc" ? x - y : y - x;
    });
  }, [runs, sortDir]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3">Run ID</th>
            <th className="px-3 py-3">Agent</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">
              <button className="btn-ghost px-1 py-0.5 text-xs font-semibold" onClick={() => setSortDir((v) => (v === "asc" ? "desc" : "asc"))}>
                Created At {sortDir === "asc" ? "↑" : "↓"}
              </button>
            </th>
            <th className="px-3 py-3">Completed At</th>
            <th className="px-3 py-3">Duration</th>
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((run) => (
            <tr className="border-b border-slate-100" key={run.runId}>
              <td className="px-3 py-3 font-mono text-xs">{run.runId}</td>
              <td className="px-3 py-3">{run.agentId}</td>
              <td className="px-3 py-3"><StatusBadge status={run.status} /></td>
              <td className="px-3 py-3">{formatDate(run.createdAt)}</td>
              <td className="px-3 py-3">{formatDate(run.completedAt)}</td>
              <td className="px-3 py-3">{run.duration ?? "-"}</td>
              <td className="px-3 py-3">
                <Link className="text-sap-700 hover:underline" href={`/runs/${run.runId}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
          {!sorted.length ? (
            <tr>
              <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>
                No runs found for selected filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
