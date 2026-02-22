import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { AgentRun } from "@/lib/types";
import { extractMeta, getSummaryCards } from "@/lib/report-mappers";
import { createOrdersModel, OrdersQueryState, parseOrdersQuery, toPriorityBuckets } from "@/lib/orders-model";
import { formatScore } from "@/lib/score-utils";

const styles = StyleSheet.create({
  page: { padding: 22, fontSize: 9.5, color: "#102a43" },
  headerBar: { backgroundColor: "#0b74de", color: "#fff", padding: 10, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: 700 },
  subtitle: { fontSize: 9, marginTop: 2 },
  section: { marginBottom: 10, border: "1 solid #dbe5ef", padding: 8 },
  sectionTitle: { fontSize: 10.5, color: "#005db6", marginBottom: 5, fontWeight: 700 },
  row: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  card: { border: "1 solid #dbe5ef", padding: 6, minWidth: 120, marginBottom: 5 },
  table: { border: "1 solid #dbe5ef" },
  tr: { flexDirection: "row", borderBottom: "1 solid #e6edf5" },
  th: { flex: 1, padding: 4, fontWeight: 700, backgroundColor: "#eef6ff" },
  td: { flex: 1, padding: 4 },
  footer: { position: "absolute", bottom: 10, left: 22, right: 22, fontSize: 8, color: "#486581", flexDirection: "row", justifyContent: "space-between" },
});

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function buildTableRows(run: AgentRun, queryState: OrdersQueryState) {
  const model = createOrdersModel(run, queryState);
  const rows = model.displayedRows.map((row) => {
    const score = formatScore(row.riskScore, row.riskScale === "0-1" ? "0-1" : "0-100");
    return [
      row.id,
      row.customer || "-",
      row.material || "-",
      row.dateLabel || "-",
      row.riskLevel || "-",
      `${score.display} (${score.scaleLabel})`,
      row.amountLabel || "-",
      row.sentiment || "-",
      row.actions[0] || "-",
    ];
  });

  return { model, rows };
}

export function buildReportDocument({
  run,
  agentName,
  queryState,
}: {
  run: AgentRun;
  agentName: string;
  queryState?: Partial<OrdersQueryState>;
}) {
  const state = {
    ...parseOrdersQuery({}),
    ...(queryState || {}),
  };
  const meta = extractMeta(run.resultJson);
  const { model, rows } = buildTableRows(run, state);
  const baseCards = getSummaryCards(run.agentId, run.resultJson);
  const cards =
    run.agentId === "agent_3"
      ? baseCards.map((card) =>
          card.label === "Average Risk Score"
            ? { ...card, value: model.kpis.avgRisk === null ? "-" : Number(model.kpis.avgRisk.toFixed(1)) }
            : card,
        )
      : run.agentId === "agent_2"
        ? [
            ...baseCards,
            {
              label: "Average Risk Score (Current View)",
              value: model.kpis.avgRisk === null ? "-" : Number(model.kpis.avgRisk.toFixed(1)),
            },
          ]
        : baseCards;
  const rowPages = chunk(rows, 24);
  if (!rowPages.length) rowPages.push([]);
  const rowHeaders = ["Identifier", "Customer / Source", "Material / Context", "Date", "Risk", model.primaryScoreLabel, "Amount / Value", "Sentiment", "Action"];
  const buckets = toPriorityBuckets(model.displayedRows);

  return (
    <Document>
      {rowPages.map((pageRows, pageIndex) => (
        <Page key={`rows-${pageIndex}`} size="A4" style={styles.page} wrap>
          {pageIndex === 0 ? (
            <View style={styles.headerBar}>
              <Text style={styles.title}>SAP HANA Insights Dashboard</Text>
              <Text style={styles.subtitle}>{agentName}</Text>
              <Text style={styles.subtitle}>Run ID: {run.runId}</Text>
              <Text style={styles.subtitle}>Sort: {state.sortBy} ({state.sortDir}) | Risk filter: {state.risk || "all"} | Search: {state.search || "-"}</Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{agentName} - Continued Orders</Text>
              <Text>Run ID: {run.runId}</Text>
            </View>
          )}

          {pageIndex === 0 ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Meta</Text>
                <Text>As Of Date: {meta.as_of_date || "-"}</Text>
                <Text>Row Count: {String(meta.row_count ?? "-")}</Text>
                <Text>Columns: {(meta.columns_detected || []).join(", ") || "-"}</Text>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <View style={styles.row}>{cards.map((c) => <View style={styles.card} key={c.label}><Text>{c.label}</Text><Text>{String(c.value)}</Text></View>)}</View>
              </View>
            </>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orders ({model.displayedRows.length})</Text>
            <View style={styles.table}>
              <View style={styles.tr}>{rowHeaders.map((h) => <Text key={`${pageIndex}-${h}`} style={styles.th}>{h}</Text>)}</View>
              {pageRows.map((row, idx) => (
                <View style={styles.tr} key={`row-${pageIndex}-${idx}`}>
                  {row.map((value, i) => <Text key={`cell-${pageIndex}-${idx}-${i}`} style={styles.td}>{value}</Text>)}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer} fixed>
            <Text>Generated by SAP HANA Insights Dashboard</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}

      <Page size="A4" style={styles.page} wrap>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Actions</Text>
          {(["P0", "P1", "P2"] as const).map((priority) => (
            <View key={priority} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: 700 }}>{priority}</Text>
              {(buckets[priority] || []).length ? (
                (buckets[priority] || []).map((item, idx) => (
                  <Text key={`${priority}-${idx}`}>{item.id}: {item.action}</Text>
                ))
              ) : (
                <Text>No items.</Text>
              )}
            </View>
          ))}
        </View>
        <View style={styles.footer} fixed>
          <Text>Generated by SAP HANA Insights Dashboard</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
