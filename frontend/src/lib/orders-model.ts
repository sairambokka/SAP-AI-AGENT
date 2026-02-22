import { AgentId, AgentRun, Priority } from "@/lib/types";
import { asDateTs, parseAmount, safeArray } from "@/lib/utils";
import { formatLabel, formatSentiment, formatTier } from "@/lib/table-formatters";

export type OrdersSortBy = string;
export type OrdersSortDir = "asc" | "desc";
export type RiskFilter = "all" | "high" | "medium" | "low" | "unknown";

export interface OrdersQueryState {
  search: string;
  sortBy: OrdersSortBy;
  sortDir: OrdersSortDir;
  risk: RiskFilter;
}

export interface NormalizedOrderRow {
  id: string;
  customer: string | null;
  material: string | null;
  context: string | null;
  dateLabel: string | null;
  dateTs: number | null;
  amount: number | null;
  amountLabel: string | null;
  riskLevel: string;
  riskScore: number | null;
  riskScale: "0-1" | "0-100";
  sentiment: string | null;
  sentimentConfidence: number | null;
  unspscConfidence: number | null;
  hazardConfidence: number | null;
  onTimeDeliveryPercent: number | null;
  daysOfSupply: number | null;
  urgencyTier: string | null;
  delayProbability: number | null;
  actions: string[];
  status: string;
  priority: Priority;
  traceSteps: string[];
}

export interface OrdersColumnDef {
  key: string;
  label: string;
  sortable: boolean;
  valueType: "string" | "number";
  cellType?: "text" | "number" | "risk" | "sentiment" | "tier" | "action";
  accessor: (row: NormalizedOrderRow) => string | number | null;
  displayAccessor?: (row: NormalizedOrderRow) => string | number | null;
  sortAccessor?: (row: NormalizedOrderRow) => string | number | null;
  decimals?: number;
  suffix?: string;
  barScale?: "0-1" | "0-100";
  isPrimaryScore?: boolean;
  isDate?: boolean;
}

export interface OrdersSortOption {
  key: string;
  label: string;
}

export interface OrdersKpis {
  count: number;
  avgRisk: number | null;
  highRiskCount: number;
}

export interface OrdersModel {
  agentId: AgentId;
  rows: NormalizedOrderRow[];
  displayedRows: NormalizedOrderRow[];
  columns: OrdersColumnDef[];
  availableSorts: OrdersSortOption[];
  state: OrdersQueryState;
  kpis: OrdersKpis;
  primaryScoreLabel: string;
  primaryScoreSortKey: string | null;
  dateSortKey: string | null;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function nullableText(value: unknown) {
  if (!hasText(value)) return null;
  return String(value).trim();
}

function nullableLabel(value: unknown) {
  const text = nullableText(value);
  if (!text) return null;
  const formatted = formatLabel(text);
  return formatted === "-" ? null : formatted;
}

function nullableNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function riskLevelFromScore(score: number | null) {
  if (score === null || Number.isNaN(score)) return "unknown";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function riskSortWeight(riskLevel?: string | null) {
  const normalized = String(riskLevel || "unknown").toLowerCase();
  if (normalized === "high") return 3;
  if (normalized === "medium") return 2;
  if (normalized === "low") return 1;
  return 0;
}

function priorityFromRow(row: NormalizedOrderRow): Priority {
  const urgency = String(row.status || "").toUpperCase();
  if (urgency === "P0") return "P0";
  if (urgency === "P1") return "P1";
  if (urgency === "P2") return "P2";

  if (row.riskLevel === "high") return "P0";
  if (row.riskLevel === "medium") return "P1";
  return "P2";
}

function toActions(value: unknown) {
  const raw = safeArray<any>(value as any[]);
  return raw
    .map((action) => {
      if (!action) return "";
      if (typeof action === "string") return action;
      if (typeof action === "object") {
        const priority = typeof action.priority === "string" ? `${action.priority}: ` : "";
        const label = action.action || action.flag_type || action.reason;
        const rationale = action.rationale ? ` (${action.rationale})` : "";
        return `${priority}${String(label || "").trim()}${rationale}`.trim();
      }
      return String(action);
    })
    .filter(Boolean);
}

function normalizeAgent1(run: AgentRun) {
  const result = run.resultJson || {};
  const orders = safeArray<any>(result?.late_delivery_probability?.orders);
  const customerSentiment = new Map(
    safeArray<any>(result?.customer_sentiment?.customers).map((customer) => {
      const sentimentText = formatSentiment(customer?.sentiment);
      return [
        String(customer?.customer || ""),
        {
          sentiment: sentimentText === "-" ? null : sentimentText,
          confidence: nullableNumber(customer?.confidence),
        },
      ];
    }),
  );

  return orders.map<NormalizedOrderRow>((order) => {
    const riskScore = nullableNumber(order.probability_score);
    const riskLevel = String(order.risk_level || riskLevelFromScore(riskScore)).toLowerCase();
    const customer = nullableText(order.customer);
    const sentiment = customer ? customerSentiment.get(customer) : null;
    return {
      id: String(order.sales_order || order.salesOrder || "-"),
      customer,
      material: nullableText(order.material),
      context: nullableLabel(order.status),
      dateLabel: nullableText(order.delivery_date || order.deliveryDate),
      dateTs: asDateTs(order.delivery_date || order.deliveryDate),
      amount: parseAmount(order.net_value ?? order.value),
      amountLabel: nullableText(order.net_value || order.value),
      riskLevel,
      riskScore,
      riskScale: "0-100",
      sentiment: sentiment?.sentiment || null,
      sentimentConfidence: sentiment?.confidence ?? null,
      unspscConfidence: null,
      hazardConfidence: null,
      onTimeDeliveryPercent: null,
      daysOfSupply: null,
      urgencyTier: null,
      delayProbability: null,
      actions: toActions(order.recommended_actions),
      status: nullableText(order.status) || "-",
      priority: "P2",
      traceSteps: [],
    };
  }).map((row) => ({ ...row, priority: priorityFromRow(row) }));
}

function severityToRiskScore(severity: string) {
  if (severity === "high") return 100;
  if (severity === "medium") return 60;
  if (severity === "low") return 20;
  return 0;
}

function normalizeAgent2(run: AgentRun) {
  const rows = safeArray<any>(run.resultJson?.classification_results);
  return rows.map<NormalizedOrderRow>((row) => {
    const flags = safeArray<any>(row.risk_flags);
    const severity = flags[0]?.severity ? String(flags[0].severity).toLowerCase() : "none";
    const riskScore = severityToRiskScore(severity);
    return {
      id: String(row.material || "-"),
      customer: nullableText(row.plant),
      material: nullableText(row.description),
      context: nullableText(row.current_group),
      dateLabel: null,
      dateTs: null,
      amount: null,
      amountLabel: null,
      riskLevel: riskLevelFromScore(riskScore),
      riskScore,
      riskScale: "0-100",
      sentiment: null,
      sentimentConfidence: null,
      unspscConfidence: nullableNumber(row.unspsc?.confidence),
      hazardConfidence: nullableNumber(row.hazard_class?.confidence),
      onTimeDeliveryPercent: null,
      daysOfSupply: null,
      urgencyTier: null,
      delayProbability: null,
      actions: toActions(flags),
      status: nullableText(row.procurement_type_suggestion?.type) || "-",
      priority: "P2",
      traceSteps: [],
    };
  }).map((row) => ({ ...row, priority: priorityFromRow(row) }));
}

function normalizeAgent3(run: AgentRun) {
  const rows = safeArray<any>(run.resultJson?.supplier_scorecards);
  return rows.map<NormalizedOrderRow>((row) => {
    const riskScore = nullableNumber(row.risk_assessment?.risk_score);
    const sentimentValue = formatSentiment(row.email_sentiment?.sentiment);
    return {
      id: String(row.supplier || "-"),
      customer: nullableText(row.supplier),
      material: nullableText(row.performance_metrics?.spend),
      context: nullableLabel(row.delivery_reliability?.classification),
      dateLabel: null,
      dateTs: null,
      amount: parseAmount(row.performance_metrics?.spend),
      amountLabel: nullableText(row.performance_metrics?.spend),
      riskLevel: String(row.risk_assessment?.risk_level || riskLevelFromScore(riskScore)).toLowerCase(),
      riskScore,
      riskScale: "0-100",
      sentiment: sentimentValue === "-" ? null : sentimentValue,
      sentimentConfidence: nullableNumber(row.email_sentiment?.confidence),
      unspscConfidence: null,
      hazardConfidence: null,
      onTimeDeliveryPercent: nullableNumber(row.performance_metrics?.on_time_delivery_percent),
      daysOfSupply: null,
      urgencyTier: null,
      delayProbability: null,
      actions: toActions(row.recommended_actions),
      status: nullableText(row.delivery_reliability?.classification) || "-",
      priority: "P2",
      traceSteps: [],
    };
  }).map((row) => ({ ...row, priority: priorityFromRow(row) }));
}

function normalizeAgent4(run: AgentRun) {
  const rows = safeArray<any>(run.resultJson?.inventory_forecasts);
  return rows.map<NormalizedOrderRow>((row) => {
    const urgencyTier = formatTier(row.reorder_recommendation?.urgency, "Not available");
    const urgencyForScore = urgencyTier.toUpperCase();
    const riskScore = urgencyForScore === "P0" ? 100 : urgencyForScore === "P1" ? 60 : urgencyForScore === "P2" ? 20 : 0;
    const trace = row.reorder_recommendation?.calculation_trace || {};
    const traceSteps = [
      `Lead time days: ${trace.lead_time_days ?? "-"}`,
      `Buffer days: ${trace.buffer_days ?? "-"}`,
      `Lead-time demand: ${trace.lead_time_demand ?? "-"}`,
      `Buffer demand: ${trace.buffer_demand ?? "-"}`,
      `Target stock level: ${trace.target_stock_level ?? "-"}`,
      `Raw reorder qty: ${trace.reorder_qty_raw ?? "-"}`,
    ];
    return {
      id: String(row.material || "-"),
      customer: nullableText(row.plant),
      material: nullableText(row.inputs?.current_stock),
      context: nullableLabel(row.forecast_status),
      dateLabel: nullableText(row.stockout_forecast?.stockout_date),
      dateTs: asDateTs(row.stockout_forecast?.stockout_date),
      amount: nullableNumber(row.reorder_recommendation?.suggested_reorder_qty),
      amountLabel: nullableText(row.reorder_recommendation?.suggested_reorder_qty),
      riskLevel: riskLevelFromScore(riskScore),
      riskScore,
      riskScale: "0-100",
      sentiment: null,
      sentimentConfidence: null,
      unspscConfidence: null,
      hazardConfidence: null,
      onTimeDeliveryPercent: null,
      daysOfSupply: nullableNumber(row.days_of_supply),
      urgencyTier,
      delayProbability: null,
      actions: toActions(row.recommended_actions),
      status: urgencyTier,
      priority: "P2",
      traceSteps,
    };
  }).map((row) => ({ ...row, priority: priorityFromRow(row) }));
}

function normalizeAgent5(run: AgentRun) {
  const rows = safeArray<any>(run.resultJson?.production_delay_predictions);
  return rows.map<NormalizedOrderRow>((row) => {
    const delayProbability = nullableNumber(row.delay_assessment?.delay_probability);
    const riskScore = nullableNumber(row.delay_assessment?.risk_score);
    const normalizedRisk = riskScore === null && delayProbability !== null ? delayProbability * 100 : riskScore;
    return {
      id: String(row.production_order || "-"),
      customer: nullableText(row.work_center),
      material: nullableLabel(row.inputs?.status),
      context: nullableText(row.inputs?.scrap_percent),
      dateLabel: nullableText(row.inputs?.end_date),
      dateTs: asDateTs(row.inputs?.end_date),
      amount: null,
      amountLabel: null,
      riskLevel: String(row.delay_assessment?.risk_level || riskLevelFromScore(normalizedRisk)).toLowerCase(),
      riskScore: normalizedRisk,
      riskScale: "0-100",
      sentiment: null,
      sentimentConfidence: null,
      unspscConfidence: null,
      hazardConfidence: null,
      onTimeDeliveryPercent: null,
      daysOfSupply: null,
      urgencyTier: null,
      delayProbability,
      actions: toActions(row.recommended_actions),
      status: nullableLabel(row.inputs?.status) || "-",
      priority: "P2",
      traceSteps: [],
    };
  }).map((item) => ({ ...item, priority: priorityFromRow(item) }));
}

export function normalizeOrders(run: AgentRun) {
  if (run.agentId === "agent_1") return normalizeAgent1(run);
  if (run.agentId === "agent_2") return normalizeAgent2(run);
  if (run.agentId === "agent_3") return normalizeAgent3(run);
  if (run.agentId === "agent_4") return normalizeAgent4(run);
  return normalizeAgent5(run);
}

function hasAnyData(rows: NormalizedOrderRow[], accessor: (row: NormalizedOrderRow) => string | number | null) {
  return rows.some((row) => {
    const value = accessor(row);
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
}

function maybeColumn(rows: NormalizedOrderRow[], column: OrdersColumnDef, required = false) {
  if (required) return column;
  return hasAnyData(rows, column.displayAccessor || column.accessor) ? column : null;
}

function getColumnSchema(agentId: AgentId, rows: NormalizedOrderRow[]): OrdersColumnDef[] {
  const actionColumn: OrdersColumnDef = {
    key: "action",
    label: "Action",
    sortable: false,
    valueType: "string",
    cellType: "action",
    accessor: (row) => row.actions[0] || null,
  };

  if (agentId === "agent_1") {
    const columns: Array<OrdersColumnDef | null> = [
      {
        key: "order_id",
        label: "Order #",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.id,
      },
      maybeColumn(rows, {
        key: "customer",
        label: "Customer",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.customer,
      }, true),
      maybeColumn(rows, {
        key: "material",
        label: "Material",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.material,
      }, true),
      maybeColumn(rows, {
        key: "delivery_date",
        label: "Delivery date",
        sortable: true,
        valueType: "number",
        accessor: (row) => row.dateTs,
        displayAccessor: (row) => row.dateLabel,
        isDate: true,
      }),
      maybeColumn(rows, {
        key: "amount",
        label: "Amount / Value",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.amount,
        decimals: 2,
      }),
      {
        key: "risk_level",
        label: "Risk level",
        sortable: true,
        valueType: "number",
        cellType: "risk",
        accessor: (row) => riskSortWeight(row.riskLevel),
        displayAccessor: (row) => row.riskLevel,
      },
      {
        key: "probability_score",
        label: "Probability score (0-100)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.riskScore,
        decimals: 1,
        barScale: "0-100",
        isPrimaryScore: true,
      },
      maybeColumn(rows, {
        key: "customer_sentiment",
        label: "Customer sentiment",
        sortable: true,
        valueType: "string",
        cellType: "sentiment",
        accessor: (row) => row.sentiment,
      }),
      maybeColumn(rows, {
        key: "sentiment_confidence",
        label: "Sentiment confidence (0-1)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.sentimentConfidence,
        decimals: 2,
        barScale: "0-1",
      }),
      actionColumn,
    ];
    return columns.filter(Boolean) as OrdersColumnDef[];
  }

  if (agentId === "agent_2") {
    const columns: Array<OrdersColumnDef | null> = [
      {
        key: "material_id",
        label: "Material #",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.id,
      },
      maybeColumn(rows, {
        key: "plant",
        label: "Plant",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.customer,
      }, true),
      maybeColumn(rows, {
        key: "description",
        label: "Description",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.material,
      }, true),
      maybeColumn(rows, {
        key: "current_group",
        label: "Current group",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.context,
      }),
      {
        key: "risk_level",
        label: "Risk level",
        sortable: true,
        valueType: "number",
        cellType: "risk",
        accessor: (row) => riskSortWeight(row.riskLevel),
        displayAccessor: (row) => row.riskLevel,
      },
      {
        key: "risk_severity_score",
        label: "Risk severity (0-100)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.riskScore,
        decimals: 1,
        barScale: "0-100",
        isPrimaryScore: true,
      },
      maybeColumn(rows, {
        key: "unspsc_confidence",
        label: "UNSPSC confidence (0-1)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.unspscConfidence,
        decimals: 2,
        barScale: "0-1",
      }),
      maybeColumn(rows, {
        key: "hazard_confidence",
        label: "Hazard confidence (0-1)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.hazardConfidence,
        decimals: 2,
        barScale: "0-1",
      }),
      actionColumn,
    ];
    return columns.filter(Boolean) as OrdersColumnDef[];
  }

  if (agentId === "agent_3") {
    const columns: Array<OrdersColumnDef | null> = [
      {
        key: "supplier",
        label: "Supplier",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.id,
      },
      maybeColumn(rows, {
        key: "spend",
        label: "Amount / Value",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.amount,
        decimals: 2,
      }),
      maybeColumn(rows, {
        key: "reliability_class",
        label: "Context",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.context,
      }),
      {
        key: "risk_level",
        label: "Risk level",
        sortable: true,
        valueType: "number",
        cellType: "risk",
        accessor: (row) => riskSortWeight(row.riskLevel),
        displayAccessor: (row) => row.riskLevel,
      },
      {
        key: "supplier_risk_score",
        label: "Supplier risk (0-100)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.riskScore,
        decimals: 1,
        barScale: "0-100",
        isPrimaryScore: true,
      },
      maybeColumn(rows, {
        key: "on_time_delivery",
        label: "On-time delivery (%)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.onTimeDeliveryPercent,
        decimals: 1,
        suffix: "%",
        barScale: "0-100",
      }),
      maybeColumn(rows, {
        key: "customer_sentiment",
        label: "Customer sentiment",
        sortable: true,
        valueType: "string",
        cellType: "sentiment",
        accessor: (row) => row.sentiment,
      }),
      maybeColumn(rows, {
        key: "sentiment_confidence",
        label: "Sentiment confidence (0-1)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.sentimentConfidence,
        decimals: 2,
        barScale: "0-1",
      }),
      actionColumn,
    ];
    return columns.filter(Boolean) as OrdersColumnDef[];
  }

  if (agentId === "agent_4") {
    const columns: Array<OrdersColumnDef | null> = [
      {
        key: "material_id",
        label: "Material #",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.id,
      },
      maybeColumn(rows, {
        key: "plant",
        label: "Plant",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.customer,
      }, true),
      maybeColumn(rows, {
        key: "forecast_status",
        label: "Forecast status",
        sortable: true,
        valueType: "string",
        accessor: (row) => row.context,
      }),
      maybeColumn(rows, {
        key: "stockout_date",
        label: "Stockout date",
        sortable: true,
        valueType: "number",
        accessor: (row) => row.dateTs,
        displayAccessor: (row) => row.dateLabel,
        isDate: true,
      }),
      maybeColumn(rows, {
        key: "reorder_qty",
        label: "Amount / Value",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.amount,
        decimals: 0,
      }),
      {
        key: "risk_level",
        label: "Risk level",
        sortable: true,
        valueType: "number",
        cellType: "risk",
        accessor: (row) => riskSortWeight(row.riskLevel),
        displayAccessor: (row) => row.riskLevel,
      },
      {
        key: "urgency_score",
        label: "Urgency score (0-100)",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.riskScore,
        decimals: 1,
        barScale: "0-100",
        isPrimaryScore: true,
      },
      maybeColumn(rows, {
        key: "days_of_supply",
        label: "Days of supply",
        sortable: true,
        valueType: "number",
        cellType: "number",
        accessor: (row) => row.daysOfSupply,
        decimals: 2,
      }),
      maybeColumn(rows, {
        key: "urgency_tier",
        label: "Urgency tier",
        sortable: true,
        valueType: "string",
        cellType: "tier",
        accessor: (row) => row.urgencyTier,
      }),
      actionColumn,
    ];
    return columns.filter(Boolean) as OrdersColumnDef[];
  }

  const columns: Array<OrdersColumnDef | null> = [
    {
      key: "production_order",
      label: "Prod order",
      sortable: true,
      valueType: "string",
      accessor: (row) => row.id,
    },
    maybeColumn(rows, {
      key: "work_center",
      label: "Work center",
      sortable: true,
      valueType: "string",
      accessor: (row) => row.customer,
    }, true),
    maybeColumn(rows, {
      key: "status",
      label: "Status",
      sortable: true,
      valueType: "string",
      accessor: (row) => row.material,
    }),
    maybeColumn(rows, {
      key: "end_date",
      label: "End date",
      sortable: true,
      valueType: "number",
      accessor: (row) => row.dateTs,
      displayAccessor: (row) => row.dateLabel,
      isDate: true,
    }),
    {
      key: "risk_level",
      label: "Risk level",
      sortable: true,
      valueType: "number",
      cellType: "risk",
      accessor: (row) => riskSortWeight(row.riskLevel),
      displayAccessor: (row) => row.riskLevel,
    },
    {
      key: "production_risk_score",
      label: "Production risk (0-100)",
      sortable: true,
      valueType: "number",
      cellType: "number",
      accessor: (row) => row.riskScore,
      decimals: 1,
      barScale: "0-100",
      isPrimaryScore: true,
    },
    maybeColumn(rows, {
      key: "delay_probability",
      label: "Delay probability (0-1)",
      sortable: true,
      valueType: "number",
      cellType: "number",
      accessor: (row) => row.delayProbability,
      decimals: 2,
      barScale: "0-1",
    }),
    actionColumn,
  ];
  return columns.filter(Boolean) as OrdersColumnDef[];
}

function compareNumeric(a: number | null, b: number | null) {
  const left = a === null || Number.isNaN(a) ? Number.NEGATIVE_INFINITY : a;
  const right = b === null || Number.isNaN(b) ? Number.NEGATIVE_INFINITY : b;
  return left - right;
}

function compareString(a: string | null, b: string | null) {
  const left = String(a || "");
  const right = String(b || "");
  return left.localeCompare(right);
}

function sortRows(rows: NormalizedOrderRow[], columns: OrdersColumnDef[], sortBy: OrdersSortBy, sortDir: OrdersSortDir) {
  const factor = sortDir === "asc" ? 1 : -1;
  const columnMap = new Map(columns.map((column) => [column.key, column]));
  const defaultColumn = columns.find((column) => column.sortable) || columns[0];
  const activeColumn = columnMap.get(sortBy) || defaultColumn;

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const accessor = activeColumn.sortAccessor || activeColumn.accessor;
      const leftValue = accessor(left.row);
      const rightValue = accessor(right.row);
      const delta =
        activeColumn.valueType === "number"
          ? compareNumeric(nullableNumber(leftValue), nullableNumber(rightValue))
          : compareString(leftValue === null ? null : String(leftValue), rightValue === null ? null : String(rightValue));
      if (delta !== 0) return delta * factor;
      return left.index - right.index;
    })
    .map((item) => item.row);
}

function filterRows(rows: NormalizedOrderRow[], state: OrdersQueryState) {
  const query = state.search.toLowerCase().trim();
  return rows.filter((row) => {
    if (state.risk !== "all" && row.riskLevel !== state.risk) return false;
    if (!query) return true;
    const haystack = `${row.id} ${row.customer || ""} ${row.material || ""}`.toLowerCase();
    return haystack.includes(query);
  });
}

function toSortOptions(columns: OrdersColumnDef[]) {
  return columns.filter((column) => column.sortable).map((column) => ({ key: column.key, label: column.label }));
}

export function parseOrdersQuery(query: Record<string, string | string[] | undefined>): OrdersQueryState {
  const read = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value || "";
  };

  const rawSortBy = read("sortBy").trim();
  const sortBy = /^[A-Za-z0-9_]+$/.test(rawSortBy) ? rawSortBy : "order_id";
  const sortDir = read("sortDir");
  const risk = read("risk");

  return {
    search: read("search"),
    sortBy,
    sortDir: sortDir === "asc" ? "asc" : "desc",
    risk: risk === "high" || risk === "medium" || risk === "low" || risk === "unknown" ? risk : "all",
  };
}

function primaryScoreLabelFromColumns(columns: OrdersColumnDef[]) {
  return columns.find((column) => column.isPrimaryScore)?.label || "Risk score (0-100)";
}

export function createOrdersModel(run: AgentRun, state: OrdersQueryState): OrdersModel {
  const rows = normalizeOrders(run);
  const columns = getColumnSchema(run.agentId, rows);
  const sortOptions = toSortOptions(columns);
  const primaryScoreSortKey = columns.find((column) => column.isPrimaryScore)?.key || null;
  const dateSortKey = columns.find((column) => column.isDate)?.key || null;
  const defaultSortBy = primaryScoreSortKey || sortOptions[0]?.key || "order_id";
  const validSortKeys = new Set(sortOptions.map((option) => option.key));

  const normalizedState: OrdersQueryState = {
    ...state,
    risk: state.risk || "all",
    sortBy: validSortKeys.has(state.sortBy) ? state.sortBy : defaultSortBy,
  };

  const filteredRows = filterRows(rows, normalizedState);
  const displayedRows = sortRows(filteredRows, columns, normalizedState.sortBy, normalizedState.sortDir);
  const withRisk = displayedRows.filter((row) => row.riskScore !== null);
  const avgRisk = withRisk.length ? withRisk.reduce((sum, row) => sum + Number(row.riskScore || 0), 0) / withRisk.length : null;
  const highRiskCount = displayedRows.filter((row) => row.riskLevel === "high").length;

  return {
    agentId: run.agentId,
    rows,
    displayedRows,
    columns,
    availableSorts: sortOptions,
    state: normalizedState,
    primaryScoreLabel: primaryScoreLabelFromColumns(columns),
    primaryScoreSortKey,
    dateSortKey,
    kpis: {
      count: displayedRows.length,
      avgRisk,
      highRiskCount,
    },
  };
}

export function toPriorityBuckets(rows: NormalizedOrderRow[]) {
  const buckets: Record<Priority, Array<{ id: string; action: string }>> = {
    P0: [],
    P1: [],
    P2: [],
    not_available: [],
  };

  rows.forEach((row) => {
    const action = row.actions[0] || "Review and follow standard operating procedure.";
    const priority = row.priority || "P2";
    if (!buckets[priority]) buckets[priority] = [];
    buckets[priority].push({ id: row.id, action });
  });

  return buckets;
}
