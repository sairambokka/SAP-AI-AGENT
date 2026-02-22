export type AgentId = "agent_1" | "agent_2" | "agent_3" | "agent_4" | "agent_5";

export type RunStatus = "queued" | "running" | "success" | "failure";

export type Priority = "P0" | "P1" | "P2" | "not_available" | string;

export type RiskLevel = "high" | "medium" | "low" | "unknown" | string;

export interface AgentMeta {
  as_of_date?: string;
  row_count?: number;
  columns_detected?: string[];
  assumptions_used?: Array<{ name: string; value: string | number | null; reason?: string }>;
  data_quality_issues?: Array<Record<string, unknown>>;
}

export interface AgentRun {
  runId: string;
  agentId: AgentId;
  status: RunStatus;
  createdAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  parameters?: Record<string, unknown>;
  resultJson?: Record<string, any>;
}

export interface AgentDescriptor {
  id: AgentId;
  name: string;
  description: string;
}
