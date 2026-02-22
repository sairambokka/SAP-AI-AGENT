"use client";

import { OrdersColumnDef, OrdersSortDir, NormalizedOrderRow } from "@/lib/orders-model";
import { formatNumber, formatSentiment, formatTier } from "@/lib/table-formatters";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/risk-badge";

function toBarPercent(value: number, barScale?: "0-1" | "0-100") {
  if (barScale === "0-1") return Math.max(0, Math.min(100, value * 100));
  if (barScale === "0-100") return Math.max(0, Math.min(100, value));
  return null;
}

function renderCellValue(row: NormalizedOrderRow, column: OrdersColumnDef) {
  const displayValue = column.displayAccessor ? column.displayAccessor(row) : column.accessor(row);

  if (column.cellType === "risk") {
    return <RiskBadge value={String(displayValue || "unknown").toLowerCase()} />;
  }

  if (column.cellType === "sentiment") {
    return formatSentiment(typeof displayValue === "string" ? displayValue : null);
  }

  if (column.cellType === "tier") {
    return formatTier(typeof displayValue === "string" ? displayValue : null);
  }

  if (column.cellType === "action") {
    const action = typeof displayValue === "string" && displayValue.trim() ? displayValue : "-";
    return (
      <div>
        <p>{action}</p>
        {row.traceSteps.length ? (
          <details className="mt-1">
            <summary className="cursor-pointer text-xs text-sap-700">How calculated</summary>
            <ul className="mt-1 list-disc pl-4 text-xs text-slate-600">
              {row.traceSteps.map((step, idx) => <li key={`${row.id}-trace-${idx}`}>{step}</li>)}
            </ul>
          </details>
        ) : null}
      </div>
    );
  }

  if (column.cellType === "number") {
    const numeric = typeof displayValue === "number" ? displayValue : Number(displayValue);
    if (!Number.isFinite(numeric)) return "-";
    const percent = toBarPercent(numeric, column.barScale);
    return (
      <div className="w-28">
        <p className="text-xs font-medium text-slate-700">
          {formatNumber(numeric, column.decimals ?? 1)}
          {column.suffix || ""}
        </p>
        {percent === null ? null : (
          <div className="mt-1 h-1.5 rounded bg-slate-200">
            <div className="h-full rounded bg-sap-500" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (displayValue === null || displayValue === undefined || String(displayValue).trim() === "") return "-";
  return String(displayValue);
}

export function OrdersTable({
  rows,
  columns,
  sortBy,
  sortDir,
  onSortChange,
  splitScrollAxes,
}: {
  rows: NormalizedOrderRow[];
  columns: OrdersColumnDef[];
  sortBy: string;
  sortDir: OrdersSortDir;
  onSortChange: (sortBy: string, sortDir: OrdersSortDir) => void;
  splitScrollAxes?: boolean;
}) {
  const table = (
    <table className="min-w-[1100px] text-sm">
      <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className={cn("px-2 py-2", column.cellType === "number" ? "text-right" : "")}>
              {column.sortable ? (
                <button
                  className="btn-ghost px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                  onClick={() => onSortChange(column.key, sortBy === column.key && sortDir === "desc" ? "asc" : "desc")}
                >
                  {column.label} {sortBy === column.key ? (sortDir === "asc" ? "^" : "v") : ""}
                </button>
              ) : (
                column.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-100 align-top">
            {columns.map((column) => (
              <td key={`${row.id}-${column.key}`} className={cn("px-2 py-2", column.cellType === "number" ? "text-right" : "")}>
                {renderCellValue(row, column)}
              </td>
            ))}
          </tr>
        ))}
        {!rows.length ? (
          <tr>
            <td className="px-2 py-6 text-center text-slate-500" colSpan={columns.length || 1}>No rows match current filters.</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );

  if (splitScrollAxes) {
    return (
      <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-slate-200 pr-1">
        <div className="overflow-x-auto">
          {table}
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-x-auto overflow-y-auto rounded-lg border border-slate-200">
      {table}
    </div>
  );
}
