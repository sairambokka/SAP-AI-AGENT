import { AGENTS } from "@/lib/constants";
import { AgentCard } from "@/components/dashboard/agent-card";

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Insight Agents</h2>
            <p className="mt-1 text-sm text-slate-600">
              Run AI analysis with HANA-first sourcing, inspect latest insights, and track run outcomes.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="font-semibold text-slate-900">5</p>
              <p className="text-slate-500">Agents</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="font-semibold text-slate-900">HANA</p>
              <p className="text-slate-500">Primary Source</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="font-semibold text-slate-900">JSON/PDF</p>
              <p className="text-slate-500">Exports</p>
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
      </section>
    </div>
  );
}
