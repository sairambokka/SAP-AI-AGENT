import Link from "next/link";
import { getRun } from "@/lib/api-client";
import { AGENT_MAP } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { RunReport } from "@/components/reports/run-report";
import { DownloadJsonButton } from "@/components/ui/download-json-button";
import { DownloadPdfButton } from "@/components/ui/download-pdf-button";

export default async function RunDetailsPage({ params }: { params: { runId: string } }) {
  let run = null;
  let error = "";

  try { run = await getRun(params.runId); } catch (e) { error = e instanceof Error ? e.message : "Failed to load run"; }
  if (!run) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">{error || "Run not found."}</div>;

  const agentName = AGENT_MAP[run.agentId]?.name || run.agentId;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Run Details</h2><p className="text-sm text-slate-600">{agentName}</p></div><StatusBadge status={run.status} /></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500">Run ID</p><p className="font-mono text-xs">{run.runId}</p></div><div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500">Created At</p><p>{formatDate(run.createdAt)}</p></div><div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500">Completed At</p><p>{formatDate(run.completedAt)}</p></div><div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500">Duration</p><p>{run.duration ?? "-"}</p></div></div>

        {run.parameters ? <details className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-medium">Input Parameters</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(run.parameters, null, 2)}</pre></details> : null}
        {run.error ? <div className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{run.error}</div> : null}

        {run.status === "success" && run.resultJson ? <div className="mt-4 flex flex-wrap gap-2"><DownloadJsonButton run={run} /><DownloadPdfButton run={run} agentName={agentName} /></div> : null}
        <div className="mt-4"><Link className="text-sm text-sap-700 hover:underline" href="/runs">Back to Run History</Link></div>
      </section>

      <RunReport run={run} />
    </div>
  );
}
