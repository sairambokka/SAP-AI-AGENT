import { AgentId } from "@/lib/types";
import { ScoreScale } from "@/lib/score-utils";

export interface ScoreExplainer {
  key: string;
  title: string;
  meaning: string;
  scale: ScoreScale | "P0-P2";
  computedFrom: string;
  interpretation: string;
}

export const SCORE_EXPLAINERS: Record<AgentId, ScoreExplainer[]> = {
  agent_1: [
    {
      key: "probability_score",
      title: "Delay Probability Score",
      meaning: "Likelihood that an order will miss delivery expectations.",
      scale: "0-100",
      computedFrom: "Order status, quantity, and delivery-date risk indicators.",
      interpretation: "Higher score means higher delivery risk. 70+ is high risk.",
    },
    {
      key: "sentiment_confidence",
      title: "Sentiment Confidence",
      meaning: "Confidence level for inferred customer sentiment.",
      scale: "0-1",
      computedFrom: "Signals extracted from customer/order context.",
      interpretation: "Values near 1.0 are more reliable than low-confidence values.",
    },
  ],
  agent_2: [
    {
      key: "risk_severity_score",
      title: "Risk Severity Score",
      meaning: "Numeric risk score used to rank materials by classification risk.",
      scale: "0-100",
      computedFrom: "Backend risk_flags.severity mapped as high=100, medium=60, low=20, none=0.",
      interpretation: "Higher score indicates higher procurement/classification risk requiring earlier review.",
    },
    {
      key: "unspsc_confidence",
      title: "UNSPSC Confidence",
      meaning: "Confidence that the material was mapped to the right UNSPSC category.",
      scale: "0-1",
      computedFrom: "Material text similarity and category matching rules.",
      interpretation: "Higher confidence means stronger category fit.",
    },
    {
      key: "hazard_confidence",
      title: "Hazard Confidence",
      meaning: "Confidence of the hazard classification output.",
      scale: "0-1",
      computedFrom: "Description-based hazard classification signals.",
      interpretation: "Low confidence should be manually reviewed.",
    },
  ],
  agent_3: [
    {
      key: "risk_score",
      title: "Supplier Risk Score",
      meaning: "Overall risk score for each supplier.",
      scale: "0-100",
      computedFrom: "On-time delivery, quality score, spend profile, and sentiment evidence.",
      interpretation: "Higher score means higher supplier risk.",
    },
    {
      key: "average_risk_score",
      title: "Average Risk Score",
      meaning: "Mean risk score across the currently visible suppliers.",
      scale: "0-100",
      computedFrom: "Arithmetic mean of supplier-level risk scores in current view.",
      interpretation: "Tracks portfolio-level risk trend in current filter/sort context.",
    },
    {
      key: "sentiment_confidence",
      title: "Sentiment Confidence",
      meaning: "Confidence of supplier sentiment analysis.",
      scale: "0-1",
      computedFrom: "Email/evidence sentiment scoring model output.",
      interpretation: "Higher confidence means sentiment label is more reliable.",
    },
  ],
  agent_4: [
    {
      key: "days_of_supply",
      title: "Days of Supply",
      meaning: "How long stock will last at current consumption rate.",
      scale: "0-100",
      computedFrom: "CurrentStock / DailyConsumption, shown in days.",
      interpretation: "Low values imply upcoming stockout risk.",
    },
    {
      key: "urgency",
      title: "Reorder Urgency",
      meaning: "Priority class for replenishment action.",
      scale: "P0-P2",
      computedFrom: "Lead-time demand, buffer demand, and stockout horizon.",
      interpretation: "P0 is urgent, P1 is soon, P2 is monitor.",
    },
  ],
  agent_5: [
    {
      key: "delay_probability",
      title: "Delay Probability",
      meaning: "Predicted chance that a production order is delayed.",
      scale: "0-1",
      computedFrom: "Order status, scrap rate, work center congestion, and schedule pressure.",
      interpretation: "Higher probability means higher delay risk.",
    },
    {
      key: "risk_score",
      title: "Production Risk Score",
      meaning: "Composite risk score for production delay.",
      scale: "0-100",
      computedFrom: "Weighted risk drivers used in delay assessment.",
      interpretation: "70+ generally indicates high-risk orders needing intervention.",
    },
  ],
};
