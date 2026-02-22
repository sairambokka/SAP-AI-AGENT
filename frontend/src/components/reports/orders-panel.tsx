"use client";

import { OrdersModel, OrdersQueryState, RiskFilter } from "@/lib/orders-model";
import { cn, formatNumber } from "@/lib/utils";
import { OrdersTable } from "@/components/reports/orders-table";

const riskOptions: RiskFilter[] = ["all", "high", "medium", "low", "unknown"];

export function OrdersPanel({
  model,
  onStateChange,
}: {
  model: OrdersModel;
  onStateChange: (patch: Partial<OrdersQueryState>) => void;
}) {
  const highRiskOnly = model.state.risk === "high";
  const primaryScoreSortKey = model.primaryScoreSortKey;
  const dateSortKey = model.dateSortKey;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Orders</h3>
          <p className="text-xs text-slate-500">All rows are shown by default. Filters and sorting are reflected in exports.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
            <p className="font-semibold text-slate-900">{model.kpis.count}</p>
            <p className="text-slate-500">Visible rows</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
            <p className="font-semibold text-slate-900">{model.kpis.avgRisk === null ? "-" : formatNumber(model.kpis.avgRisk, 1)}</p>
            <p className="text-slate-500">Avg risk (0-100)</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
            <p className="font-semibold text-slate-900">{model.kpis.highRiskCount}</p>
            <p className="text-slate-500">High risk</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1.1fr_0.7fr_0.4fr]">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Search by order id, customer, material"
          value={model.state.search}
          onChange={(event) => onStateChange({ search: event.target.value })}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={model.state.sortBy}
          onChange={(event) => onStateChange({ sortBy: event.target.value })}
        >
          {model.availableSorts.map((option) => (
            <option key={option.key} value={option.key}>
              Sort by {option.label}
            </option>
          ))}
        </select>
        <button
          className="btn-secondary px-3 py-2 text-sm"
          onClick={() => onStateChange({ sortDir: model.state.sortDir === "asc" ? "desc" : "asc" })}
        >
          {model.state.sortDir === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {model.agentId === "agent_1" ? (
          <button
            className={cn("btn-secondary px-3 py-1.5 text-xs", highRiskOnly ? "border-rose-300 bg-rose-50 text-rose-700" : "")}
            onClick={() => onStateChange({ risk: highRiskOnly ? "all" : "high" })}
          >
            High risk only: {highRiskOnly ? "ON" : "OFF"}
          </button>
        ) : null}
        {riskOptions.map((risk) => (
          <button
            key={risk}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition",
              model.state.risk === risk ? "border-sap-500 bg-sap-50 text-sap-700" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
            )}
            onClick={() => onStateChange({ risk })}
          >
            {risk === "all" ? "All risk levels" : risk[0].toUpperCase() + risk.slice(1)}
          </button>
        ))}
        {primaryScoreSortKey ? (
          <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => onStateChange({ sortBy: primaryScoreSortKey, sortDir: "desc" })}>
            Highest {model.primaryScoreLabel.toLowerCase()} first
          </button>
        ) : null}
        {dateSortKey ? (
          <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => onStateChange({ sortBy: dateSortKey, sortDir: "desc" })}>
            Latest dates
          </button>
        ) : null}
      </div>

      <div className="mt-3">
        <OrdersTable
          rows={model.displayedRows}
          columns={model.columns}
          sortBy={model.state.sortBy}
          sortDir={model.state.sortDir}
          onSortChange={(sortBy, sortDir) => onStateChange({ sortBy, sortDir })}
          splitScrollAxes={model.agentId === "agent_1"}
        />
      </div>
    </section>
  );
}
