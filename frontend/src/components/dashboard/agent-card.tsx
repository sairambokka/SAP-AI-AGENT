import Link from "next/link";
import { AgentDescriptor } from "@/lib/types";
import { QuickRunButton } from "@/components/dashboard/quick-run-button";

export function AgentCard({ agent }: { agent: AgentDescriptor }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">HANA-first</span>
        <span className="text-xs font-medium text-sap-700">Realtime Run</span>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{agent.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{agent.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <QuickRunButton agentId={agent.id} />
        <Link className="btn-secondary px-3 py-2 text-sm" href={`/agents/${agent.id}`}>
          View Latest
        </Link>
        <Link className="btn-secondary px-3 py-2 text-sm" href={`/runs?agentId=${agent.id}`}>
          History
        </Link>
      </div>
    </article>
  );
}
