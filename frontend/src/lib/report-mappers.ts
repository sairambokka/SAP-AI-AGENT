import { AgentId } from "@/lib/types";
import { safeArray } from "@/lib/utils";

export function extractMeta(result: Record<string, any> | undefined) {
  const meta = (result?.meta || {}) as Record<string, any>;
  return {
    as_of_date: meta.as_of_date,
    row_count: meta.row_count,
    columns_detected: safeArray(meta.columns_detected),
    assumptions_used: safeArray(meta.assumptions_used),
    data_quality_issues: safeArray(meta.data_quality_issues),
  };
}

export function getSummaryCards(agentId: AgentId, result: Record<string, any> | undefined) {
  if (!result) return [] as Array<{ label: string; value: string | number }>;

  if (agentId === "agent_1") {
    const dist = result?.late_delivery_probability?.summary?.probability_distribution || {};
    return [
      { label: "High", value: dist.high ?? 0 },
      { label: "Medium", value: dist.medium ?? 0 },
      { label: "Low", value: dist.low ?? 0 },
      { label: "Unknown", value: dist.unknown ?? 0 },
    ];
  }

  if (agentId === "agent_2") {
    const s = result?.summary || {};
    return [
      { label: "Hazardous", value: s.hazardous_material_count ?? 0 },
      { label: "External Procurement", value: s.external_procurement_count ?? 0 },
      { label: "In-House Procurement", value: s.inhouse_procurement_count ?? 0 },
      { label: "Uncertain Classifications", value: s.uncertain_classifications ?? 0 },
    ];
  }

  if (agentId === "agent_3") {
    const s = result?.portfolio_summary || {};
    return [
      { label: "High Risk Suppliers", value: s.high_risk_suppliers ?? 0 },
      { label: "Medium Risk Suppliers", value: s.medium_risk_suppliers ?? 0 },
      { label: "Low Risk Suppliers", value: s.low_risk_suppliers ?? 0 },
      { label: "Average Risk Score", value: s.average_risk_score ?? 0 },
    ];
  }

  if (agentId === "agent_4") {
    const s = result?.portfolio_summary || {};
    return [
      { label: "Materials Analyzed", value: s.materials_analyzed ?? 0 },
      { label: "Not Available", value: s.materials_not_available ?? 0 },
      { label: "P0 Urgent Reorders", value: s.p0_urgent_reorders ?? 0 },
      { label: "Nearest Stockout", value: s.nearest_stockout?.material ?? "-" },
    ];
  }

  const s = result?.plant_summary || {};
  return [
    { label: "Total Orders", value: s.total_orders ?? 0 },
    { label: "High Risk", value: s.high_risk_orders ?? 0 },
    { label: "Medium Risk", value: s.medium_risk_orders ?? 0 },
    { label: "Low Risk", value: s.low_risk_orders ?? 0 },
  ];
}

export function getPriorityActions(agentId: AgentId, result: Record<string, any> | undefined) {
  if (!result) return [] as Array<{ priority: string; action: string; rationale?: string }>;

  if (agentId === "agent_1") {
    return safeArray(result?.recommended_actions?.global);
  }

  if (agentId === "agent_2") {
    return safeArray(result?.classification_results)
      .flatMap((r: any) =>
        safeArray(r.risk_flags).map((f: any) => ({
          priority: f.severity === "high" ? "P0" : f.severity === "medium" ? "P1" : "P2",
          action: `${r.material}: ${f.flag_type}`,
          rationale: f.reason,
        })),
      );
  }

  if (agentId === "agent_3") {
    return safeArray(result?.supplier_scorecards).flatMap((s: any) => safeArray(s.recommended_actions));
  }

  if (agentId === "agent_4") {
    return safeArray(result?.inventory_forecasts).flatMap((f: any) => safeArray(f.recommended_actions));
  }

  return safeArray(result?.production_delay_predictions).flatMap((p: any) => safeArray(p.recommended_actions));
}
