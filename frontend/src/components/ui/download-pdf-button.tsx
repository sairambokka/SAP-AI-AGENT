"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { AgentRun } from "@/lib/types";
import { buildReportDocument } from "@/lib/pdf/report-document";
import { parseOrdersQuery } from "@/lib/orders-model";
import { Spinner } from "@/components/ui/spinner";

export function DownloadPdfButton({ run, agentName }: { run: AgentRun; agentName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  return (
    <div>
      <button
        className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
        disabled={busy}
        onClick={async () => {
          try {
            setBusy(true);
            setError(null);
            const queryObj: Record<string, string> = {};
            searchParams.forEach((value, key) => {
              queryObj[key] = value;
            });
            const queryState = parseOrdersQuery(queryObj);
            const doc = buildReportDocument({ run, agentName, queryState });
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${run.agentId}_${run.runId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to generate PDF");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Spinner label="Generating PDF" className="text-white [&>span:last-child]:text-white" /> : "Download PDF"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
