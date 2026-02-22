import { AGENTS } from "@/lib/constants";
import { AgentId, AgentRun, RunStatus } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

class ApiError extends Error {
  code?: number;
  details?: unknown;

  constructor(message: string, code?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 30000): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = body?.error || body?.message || `Request failed (${response.status})`;
      throw new ApiError(message, response.status, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === "AbortError") {
      throw new ApiError("Request timed out");
    }
    throw new ApiError((error as Error).message || "Unknown API error");
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAgents() {
  try {
    return await request<Array<{ id: AgentId; name?: string; description?: string }>>("/api/agents");
  } catch {
    return AGENTS;
  }
}

export async function runAgent(agentId: AgentId, payload?: Record<string, unknown>) {
  return request<{ runId: string }>(`/api/agents/${agentId}/run`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function getRun(runId: string) {
  return request<AgentRun>(`/api/runs/${runId}`);
}

export interface ListRunsParams {
  agentId?: AgentId | "all";
  status?: RunStatus | "all";
  search?: string;
  from?: string;
  to?: string;
}

export async function listRuns(params?: ListRunsParams) {
  const query = new URLSearchParams();
  if (params?.agentId && params.agentId !== "all") query.set("agentId", params.agentId);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<AgentRun[]>(`/api/runs${suffix}`);
}

export async function getLatestRun(agentId: AgentId) {
  const runs = await listRuns({ agentId });
  return runs.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0] || null;
}

export { ApiError };
