import type { ProductionRequest } from "@/types/platform";

export type RecommendationAction =
  | "HIGH CONFIDENCE"
  | "MODERATE CONFIDENCE"
  | "CONDITIONAL APPROVAL"
  | "LOW CONFIDENCE";

export interface LenderFinancingRecommendation {
  action: RecommendationAction;
  suggestedAmount: number;
  summary: string;
  coveragePct: number;
  riskLevel: string;
}

export function totalCollateralValue(request: ProductionRequest): number {
  return (request.collateral ?? []).reduce((sum, item) => sum + (item.estimated_value ?? 0), 0);
}

export function deriveLenderRecommendation(request: ProductionRequest): LenderFinancingRecommendation {
  const rec = request.financing_recommendation;
  const confidence = request.confidence_score;
  const requested = request.required_funding_amount;
  const collateral = totalCollateralValue(request);
  const coveragePct = requested > 0 ? Math.round((collateral / requested) * 100) : 0;

  const engineSuggested = rec?.recommended_max ?? 0;
  const collateralCap = Math.round(collateral * 0.85);
  const confidenceFactor =
    confidence >= 86 ? 0.95 : confidence >= 75 ? 0.85 : confidence >= 68 ? 0.7 : confidence >= 55 ? 0.5 : 0.35;
  const heuristicSuggested = Math.round(Math.min(requested, collateralCap, requested * confidenceFactor));

  const suggestedAmount = engineSuggested > 0 ? engineSuggested : heuristicSuggested;

  let action: RecommendationAction;
  let summary: string;

  if (confidence >= 80) {
    action = "HIGH CONFIDENCE";
    summary = "Up to requested amount may be considered, subject to lender policy and verification.";
  } else if (confidence >= 65) {
    action = confidence >= 70 ? "MODERATE CONFIDENCE" : "CONDITIONAL APPROVAL";
    summary = `Partial financing recommended. Requested ${formatAmount(requested)}; suggested exposure ${formatAmount(suggestedAmount)}.`;
  } else {
    action = "LOW CONFIDENCE";
    summary = "Consider reduced exposure or request additional evidence before increasing financing.";
  }

  const riskLevel =
    request.risk_level === "HIGH" || request.risk_level === "CRITICAL"
      ? "HIGH"
      : confidence < 65
        ? "MODERATE"
        : "MODERATE";

  return { action, suggestedAmount, summary, coveragePct, riskLevel };
}

function formatAmount(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${Math.round(amount / 100_000)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function mapDecisionStatus(status?: string, decisions?: ProductionRequest["decisions"]): string {
  if (decisions?.length) {
    const latest = decisions[decisions.length - 1];
    const type = latest.decision_type;
    if (type === "REJECT") return "REJECTED";
    if (type === "REQUEST_MORE_INFORMATION") return "MORE INFORMATION REQUIRED";
    if (type === "PARTIALLY_APPROVE") return "PARTIALLY APPROVED";
    if (type === "CONDITIONALLY_APPROVE") return "UNDER REVIEW";
    if (type === "APPROVE") return "APPROVED";
  }
  const normalized = (status ?? "PENDING REVIEW").replace(/_/g, " ").toUpperCase();
  if (normalized.includes("ACTIVE FINANCING")) return "UNDER REVIEW";
  if (normalized.includes("SUBMITTED")) return "PENDING REVIEW";
  return normalized;
}
