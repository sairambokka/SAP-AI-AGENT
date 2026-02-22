"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { runAgent } from "@/lib/api-client";
import { AgentId } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";

export function QuickRunButton({ agentId }: { agentId: AgentId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await runAgent(agentId, {});
            router.push(`/runs/${response.runId}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to start run");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? <Spinner label="Loading agent results" className="text-white [&>span:last-child]:text-white" /> : "Run"}
      </button>
      {error ? <p className="mt-2 max-w-60 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
