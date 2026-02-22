"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AgentRun } from "@/lib/types";
import { extractMeta, getSummaryCards } from "@/lib/report-mappers";
import { formatDate } from "@/lib/utils";
import { JsonViewer } from "@/components/ui/json-viewer";
import { Spinner } from "@/components/ui/spinner";
import { OrdersPanel } from "@/components/reports/orders-panel";
import { ScoreGuide } from "@/components/reports/score-guide";
import { createOrdersModel, parseOrdersQuery, toPriorityBuckets } from "@/lib/orders-model";

function SummaryCards({ cards }: { cards: Array<{ label: string; value: string | number }> }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-sm font-semibold text-slate-900">KPI Summary</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-sap-700">{String(card.value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetaPanel({ run }: { run: AgentRun }) {
  const meta = extractMeta(run.resultJson);
  const issueTexts = (meta.data_quality_issues || []).map((issue: any) => {
    const type = issue?.type ? String(issue.type).replace(/_/g, " ") : "Issue";
    const details = issue?.details ? String(issue.details) : "No additional details.";
    return `${type}: ${details}`;
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-sm font-semibold text-slate-900">Run Metadata</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-xs text-slate-500">As Of Date</p>
          <p>{meta.as_of_date || "-"}</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-xs text-slate-500">Row Count</p>
          <p>{meta.row_count ?? "-"}</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
          <p className="text-xs text-slate-500">Detected Columns</p>
          <p className="break-words">{(meta.columns_detected || []).join(", ") || "-"}</p>
        </div>
      </div>
      <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        <p className="text-xs text-slate-500">Data Quality Notes</p>
        {!issueTexts.length ? (
          <p className="mt-1 text-slate-600">No data quality issues flagged for this run.</p>
        ) : (
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {issueTexts.map((text, idx) => <li key={`issue-${idx}`}>{text}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}

function AgentHighlights({
  run,
  avgRiskForView,
  visibleOrderCount,
}: {
  run: AgentRun;
  avgRiskForView: number | null;
  visibleOrderCount: number;
}) {
  const result = run.resultJson || {};
  if (run.agentId === "agent_1") {
    const drivers = (result?.late_delivery_probability?.summary?.top_risk_drivers || []) as string[];
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-slate-900">Agent Highlights</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {drivers.length ? drivers.map((d, idx) => <li key={`driver-${idx}`}>{d}</li>) : <li>No risk drivers returned.</li>}
        </ul>
      </section>
    );
  }

  if (run.agentId === "agent_2") {
    const summary = result?.summary || {};
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-slate-900">Agent Highlights</h3>
        <p className="mt-1 text-sm text-slate-700">
          Hazardous materials: {summary.hazardous_material_count ?? 0} | External procurement: {summary.external_procurement_count ?? 0} | In-house: {summary.inhouse_procurement_count ?? 0}
        </p>
        <p className="mt-2 text-sm text-slate-700" title="Arithmetic mean of per-order Risk Severity Score over currently displayed rows. Uses backend risk_flags.severity mapped as high=100, medium=60, low=20, none=0.">
          Average Risk Score (current view, 0-100): {avgRiskForView === null ? "-" : avgRiskForView.toFixed(1)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Computed as arithmetic mean of per-order Risk Severity Score over {visibleOrderCount} displayed rows using backend <code>risk_flags.severity</code> (same field used for high-risk tagging).
        </p>
      </section>
    );
  }

  if (run.agentId === "agent_3") {
    const attention = (result?.portfolio_summary?.suppliers_requiring_immediate_attention || []) as string[];
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-slate-900">Agent Highlights</h3>
        <p className="mt-1 text-sm text-slate-700">Average risk score for current view: {avgRiskForView === null ? "-" : avgRiskForView.toFixed(1)} (0-100 scale)</p>
        <p className="mt-1 text-sm text-slate-700">Immediate attention: {attention.length ? attention.join(", ") : "None"}</p>
      </section>
    );
  }

  if (run.agentId === "agent_4") {
    const issues = result?.meta?.data_quality_issues || [];
    const hasIssues = Array.isArray(issues) && issues.length > 0;
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-slate-900">Agent Highlights</h3>
        {!hasIssues ? (
          <p className="mt-1 text-sm text-slate-700">No data quality issues were identified for inventory forecasting inputs.</p>
        ) : (
          <div className="mt-1 text-sm text-slate-700">
            <p>Data quality checks found issues that may affect forecast confidence:</p>
            <ul className="mt-1 list-disc pl-5">
              {issues.map((issue: any, idx: number) => <li key={`agent4-issue-${idx}`}>{`${String(issue?.type || "Issue").replace(/_/g, " ")}: ${String(issue?.details || "No details")}`}</li>)}
            </ul>
          </div>
        )}
      </section>
    );
  }

  const bottlenecks = (result?.plant_summary?.identified_bottleneck_work_centers || []) as string[];
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-sm font-semibold text-slate-900">Agent Highlights</h3>
      <p className="mt-1 text-sm text-slate-700">Bottleneck work centers: {bottlenecks.length ? bottlenecks.join(", ") : "None"}</p>
    </section>
  );
}

function PriorityActionBoard({ run, rowsForCurrentView }: { run: AgentRun; rowsForCurrentView: ReturnType<typeof createOrdersModel>["displayedRows"] }) {
  const buckets = toPriorityBuckets(rowsForCurrentView);
  const priorities: Array<"P0" | "P1" | "P2"> = ["P0", "P1", "P2"];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h3 className="text-sm font-semibold text-slate-900">Priority Actions</h3>
      <p className="mt-1 text-xs text-slate-500">Actionable items are linked with relevant identifiers from the current filtered/sorted view.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {priorities.map((priority) => (
          <div key={priority} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-sm font-semibold text-slate-800">{priority}</h4>
            <ul className="mt-2 space-y-2 text-sm">
              {(buckets[priority] || []).map((item, idx) => (
                <li key={`${priority}-${item.id}-${idx}`} className="rounded border border-slate-200 bg-white p-2">
                  <p className="font-mono text-xs text-slate-700">{item.id}</p>
                  <p className="mt-1 text-slate-700">{item.action}</p>
                </li>
              ))}
              {!buckets[priority]?.length ? <li className="text-slate-500">No items.</li> : null}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RunReport({ run }: { run: AgentRun }) {
  const [tab, setTab] = useState<"structured" | "raw">("structured");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryState = useMemo(() => {
    const asObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      asObj[key] = value;
    });
    return parseOrdersQuery(asObj);
  }, [searchParams]);

  const model = useMemo(() => createOrdersModel(run, queryState), [run, queryState]);
  const cards = useMemo(() => {
    const base = getSummaryCards(run.agentId, run.resultJson);
    if (run.agentId === "agent_3") {
      return base.map((card) => (card.label === "Average Risk Score" ? { ...card, value: model.kpis.avgRisk === null ? "-" : Number(model.kpis.avgRisk.toFixed(1)) } : card));
    }

    if (run.agentId === "agent_2") {
      return [
        ...base,
        {
          label: "Average Risk Score (Current View)",
          value: model.kpis.avgRisk === null ? "-" : Number(model.kpis.avgRisk.toFixed(1)),
        },
      ];
    }

    return base;
  }, [run.agentId, run.resultJson, model.kpis.avgRisk]);

  function patchQuery(patch: Partial<typeof queryState>) {
    const next = { ...model.state, ...patch };
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", next.search);
    params.set("sortBy", next.sortBy);
    params.set("sortDir", next.sortDir);
    params.set("risk", next.risk);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (run.status === "running" || run.status === "queued") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <Spinner label="Loading agent results" />
      </div>
    );
  }

  if (!run.resultJson) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">Result JSON is not available yet.</div>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Run Report</h2>
          <div className="flex gap-2">
            <button
              className={`btn-secondary px-3 py-1.5 text-sm ${tab === "structured" ? "border-sap-500 bg-sap-600 text-white hover:bg-sap-700" : ""}`}
              onClick={() => setTab("structured")}
            >
              Structured View
            </button>
            <button
              className={`btn-secondary px-3 py-1.5 text-sm ${tab === "raw" ? "border-sap-500 bg-sap-600 text-white hover:bg-sap-700" : ""}`}
              onClick={() => setTab("raw")}
            >
              Raw JSON
            </button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">Run ID: <span className="font-mono text-xs">{run.runId}</span></div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">Created: {formatDate(run.createdAt)}</div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">Completed: {formatDate(run.completedAt)}</div>
        </div>
      </section>

      {tab === "raw" ? (
        <JsonViewer value={run.resultJson} />
      ) : (
        <>
          <SummaryCards cards={cards} />
          <ScoreGuide agentId={run.agentId} />
          <AgentHighlights run={run} avgRiskForView={model.kpis.avgRisk} visibleOrderCount={model.kpis.count} />
          <OrdersPanel model={model} onStateChange={patchQuery} />
          <PriorityActionBoard run={run} rowsForCurrentView={model.displayedRows} />
          <MetaPanel run={run} />
        </>
      )}
    </div>
  );
}
