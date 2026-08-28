import type { Asset } from "@/types/asset";
import type {
  DecisionExplanation,
  DecisionSignal,
  FinancingOpportunityScore,
  FundingReadiness,
  FundingRecommendation,
} from "@/types/decisions";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { formatCurrencyINR } from "@/lib/format";

export function explainDecision(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  opportunity: FinancingOpportunityScore,
  readiness: FundingReadiness,
  recommendation: FundingRecommendation,
): DecisionExplanation {
  const supporting: DecisionSignal[] = [];
  const blocking: DecisionSignal[] = [];

  if (assessment.financing.maximumSafeFinancing > 0) {
    supporting.push({
      id: "capacity",
      kind: "supporting",
      text: `Safe financing capacity of ${formatCurrencyINR(assessment.financing.maximumSafeFinancing, 2)}.`,
    });
  }
  if (assessment.risk.dataConfidence >= 85) {
    supporting.push({
      id: "confidence",
      kind: "supporting",
      text: `High-confidence operational evidence (${assessment.risk.dataConfidence}%).`,
    });
  }
  if (!ctx.hasMismatch && ctx.openConflicts === 0) {
    supporting.push({ id: "conflict-clear", kind: "supporting", text: "No open evidence conflicts." });
  }
  if (asset.physical.verificationStatus === "VERIFIED") {
    supporting.push({ id: "verified", kind: "supporting", text: "Verified progress on the Digital Asset Twin." });
  }
  if (assessment.risk.trend === "IMPROVING") {
    supporting.push({ id: "trend", kind: "supporting", text: "Improving Module 4 risk trend." });
  }
  if (assessment.risk.riskLevel === "LOW") {
    supporting.push({ id: "risk-low", kind: "supporting", text: "Low residual risk after trusted evidence." });
  }

  if (ctx.hasMismatch || ctx.openHighConflicts > 0) {
    blocking.push({
      id: "mismatch",
      kind: "blocking",
      text: "High-severity quantity or evidence mismatch remains unresolved.",
    });
  }
  if (ctx.openConflicts > 0 && !ctx.hasMismatch) {
    blocking.push({ id: "open-conflict", kind: "blocking", text: "An open conflict still requires reconciliation." });
  }
  if (asset.physical.verificationStatus === "PENDING_SYNC") {
    blocking.push({ id: "pending-ver", kind: "blocking", text: "Secondary verification is pending." });
  }
  if (ctx.stage === "PRODUCTION" && ctx.productionCompletion < 100) {
    blocking.push({
      id: "production",
      kind: "blocking",
      text: `Production is ${ctx.productionCompletion}% complete and not yet finished goods.`,
    });
  }
  if (ctx.stage === "PURCHASE_ORDER" || ctx.stage === "PROCUREMENT" || ctx.stage === "RAW_MATERIAL") {
    blocking.push({
      id: "early",
      kind: "blocking",
      text: "Operational evidence is still early in the supply-chain lifecycle.",
    });
  }
  if (ctx.financial === "PAYMENT_DELAYED") {
    blocking.push({ id: "payment", kind: "blocking", text: "Buyer payment delay is reducing collection certainty." });
  }
  if (ctx.logistics === "DELAYED" || ctx.logistics === "SEVERELY_DELAYED") {
    blocking.push({ id: "logistics", kind: "blocking", text: "Logistics delay detected on the current shipment." });
  }
  if (assessment.risk.riskLevel === "HIGH" || assessment.risk.riskLevel === "CRITICAL") {
    blocking.push({
      id: "risk-high",
      kind: "blocking",
      text: `Elevated risk score ${assessment.risk.overallScore} reduces confidence in the collateral.`,
    });
  }

  const leadSupport = supporting.slice(0, 4).map((item) => `+ ${item.text}`);
  const leadBlock = blocking.slice(0, 3).map((item) => `- ${item.text}`);
  const why = [
    `${asset.id} is ${recommendation.label} because opportunity is ${opportunity.score}/100 and readiness is ${readiness.score}/100.`,
    ...leadSupport,
    ...leadBlock,
  ].join(" ");

  const primaryAction =
    recommendation.category === "HOLD_FOR_REVIEW"
      ? recommendation.reviewItems[0] ?? "Resolve the primary evidence blocker, then rerun financing intelligence."
      : recommendation.category === "CONDITIONAL_FUNDING"
        ? recommendation.conditions[0] ?? "Clear the remaining condition, then consider allocation."
        : recommendation.category === "PRIORITY_FUNDING"
          ? "Continue operational monitoring and release financing according to the Module 4 capacity recommendation."
          : "Do not allocate incremental capital until evidence or lifecycle quality improves.";

  return {
    assetId: asset.id,
    category: recommendation.category,
    why,
    supporting,
    blocking,
    primaryAction,
  };
}
