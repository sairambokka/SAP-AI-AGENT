"use client";

import { AgentRun } from "@/lib/types";

export function DownloadJsonButton({ run }: { run: AgentRun }) {
  return (
    <button
      className="btn-secondary px-3 py-2 text-sm"
      onClick={() => {
        const blob = new Blob([JSON.stringify(run.resultJson || {}, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${run.agentId}_${run.runId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      Download JSON
    </button>
  );
}
