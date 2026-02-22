"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentId } from "@/lib/types";
import { runAgent } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";

export function RunAgentForm({ agentId }: { agentId: AgentId }) {
  const router = useRouter();
  const [payloadText, setPayloadText] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h2 className="text-sm font-semibold text-slate-900">Run Agent</h2>
      <p className="mt-1 text-xs text-slate-500">Pass JSON parameters if your backend supports run-time inputs.</p>
      <textarea
        className="mt-3 h-28 w-full rounded-md border border-slate-300 p-3 text-sm"
        value={payloadText}
        onChange={(e) => setPayloadText(e.target.value)}
      />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      <button
        className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-50"
        disabled={loading}
        onClick={async () => {
          try {
            setLoading(true);
            setError(null);
            const payload = payloadText.trim() ? JSON.parse(payloadText) : {};
            const response = await runAgent(agentId, payload);
            router.push(`/runs/${response.runId}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Run failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? <Spinner label="Loading agent results" className="text-white [&>span:last-child]:text-white" /> : "Run Agent"}
      </button>
    </section>
  );
}
