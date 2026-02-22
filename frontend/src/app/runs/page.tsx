import { AGENTS } from "@/lib/constants";
import { listRuns } from "@/lib/api-client";
import { RunsTable } from "@/components/runs/runs-table";
import { AgentId, AgentRun, RunStatus } from "@/lib/types";

interface RunsPageProps {
  searchParams?: {
    agentId?: AgentId | "all";
    status?: RunStatus | "all";
    search?: string;
    from?: string;
    to?: string;
  };
}

export default async function RunsPage({ searchParams }: RunsPageProps) {
  const filters = {
    agentId: searchParams?.agentId || "all",
    status: searchParams?.status || "all",
    search: searchParams?.search || "",
    from: searchParams?.from || "",
    to: searchParams?.to || "",
  };

  let runs: AgentRun[] = [];
  try { runs = await listRuns(filters); } catch { runs = []; }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold">Run History</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-5">
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={filters.agentId} name="agentId"><option value="all">All Agents</option>{AGENTS.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={filters.status} name="status"><option value="all">All Statuses</option><option value="queued">Queued</option><option value="running">Running</option><option value="success">Success</option><option value="failure">Failure</option></select>
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={filters.search} name="search" placeholder="Search runId" />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={filters.from} name="from" type="date" />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={filters.to} name="to" type="date" />
          <button className="btn-primary md:col-span-5 md:w-40">Apply Filters</button>
        </form>
      </section>
      <RunsTable runs={runs} />
    </div>
  );
}
