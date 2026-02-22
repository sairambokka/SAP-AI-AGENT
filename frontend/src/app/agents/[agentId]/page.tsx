import Link from "next/link";
import { AGENT_MAP } from "@/lib/constants";
import { AgentId } from "@/lib/types";
import { getLatestRun } from "@/lib/api-client";
import { RunAgentForm } from "@/components/agents/run-agent-form";
import { RunReport } from "@/components/reports/run-report";
import { DownloadJsonButton } from "@/components/ui/download-json-button";
import { DownloadPdfButton } from "@/components/ui/download-pdf-button";

export default async function AgentPage({ params }: { params: { agentId: AgentId } }) {
  const agent = AGENT_MAP[params.agentId];
  if (!agent) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">Unknown agent ID.</div>;

  let latestRun = null;
  try { latestRun = await getLatestRun(params.agentId); } catch { latestRun = null; }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">{agent.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{agent.description}</p>
        <div className="mt-3 flex gap-2"><Link className="btn-secondary px-3 py-2 text-sm" href={`/runs?agentId=${agent.id}`}>Open History</Link></div>
      </section>

      <RunAgentForm agentId={agent.id} />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Latest Run</h3>
        {!latestRun ? <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No runs available yet.</div> : <>
          {latestRun.status === "success" && latestRun.resultJson ? <div className="flex flex-wrap gap-2"><DownloadJsonButton run={latestRun} /><DownloadPdfButton run={latestRun} agentName={agent.name} /></div> : null}
          <RunReport run={latestRun} />
        </>}
      </section>
    </div>
  );
}
