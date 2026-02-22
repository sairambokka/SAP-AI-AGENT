"use client";

import { AgentId } from "@/lib/types";
import { SCORE_EXPLAINERS } from "@/lib/score-explainers";

export function ScoreGuide({ agentId }: { agentId: AgentId }) {
  const items = SCORE_EXPLAINERS[agentId] || [];
  if (!items.length) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-sm font-semibold text-slate-900">Score Guide</h3>
      <p className="mt-1 text-xs text-slate-500">What each score means, how it is calculated, and how to interpret it.</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <details key={item.key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              {item.title} <span className="text-slate-500">({item.scale})</span>
            </summary>
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              <p><strong>Meaning:</strong> {item.meaning}</p>
              <p><strong>Computed from:</strong> {item.computedFrom}</p>
              <p><strong>Interpretation:</strong> {item.interpretation}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
