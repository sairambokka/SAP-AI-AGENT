import { AgentDescriptor, AgentId } from "@/lib/types";

export const AGENTS: AgentDescriptor[] = [
  {
    id: "agent_1",
    name: "Agent 1: Sales & Sentiment Risk",
    description: "Late delivery risk, customer sentiment, and prioritized action guidance.",
  },
  {
    id: "agent_2",
    name: "Agent 2: Material Classification",
    description: "Material grouping, UNSPSC, hazard labeling, and procurement suggestions.",
  },
  {
    id: "agent_3",
    name: "Agent 3: Supplier Scorecards",
    description: "Supplier-level risk scoring, sentiment evidence, and portfolio risk summary.",
  },
  {
    id: "agent_4",
    name: "Agent 4: Inventory Forecasting",
    description: "Days-of-supply forecasting, stockout timing, and urgency-based reorder actions.",
  },
  {
    id: "agent_5",
    name: "Agent 5: Production Delay Prediction",
    description: "Delay probability, bottleneck identification, and plant-level risk summary.",
  },
];

export const AGENT_MAP: Record<AgentId, AgentDescriptor> = AGENTS.reduce((acc, agent) => {
  acc[agent.id] = agent;
  return acc;
}, {} as Record<AgentId, AgentDescriptor>);
