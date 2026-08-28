import type { Asset } from "@/types/asset";
import type { DecisionCategory, FinancingOpportunityScore, FundingReadiness } from "@/types/decisions";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { DECISION_THRESHOLDS } from "@/lib/demo-data/decision-config";
import { DEMO_AS_OF } from "@/lib/demo-data/valuation-config";
import { getStageIndex } from "@/lib/lifecycle";

export interface DecisionRuleHit {
  category: DecisionCategory;
  conditions: string[];
  reviewItems: string[];
  primaryReason: string;
}

function staleDays(ctx: IntelligenceContext): number {
  if (!ctx.lastEventAt) return 99;
  return Math.max(0, (new Date(DEMO_AS_OF).getTime() - new Date(ctx.lastEventAt).getTime()) / 86_400_000);
}

export function evaluateDecisionRules(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  opportunity: FinancingOpportunityScore,
  readiness: FundingReadiness,
): DecisionRuleHit {
  const capacity = assessment.financing.maximumSafeFinancing;
  const highConflict = ctx.hasMismatch || ctx.openHighConflicts > 0 || assessment.risk.riskLevel === "HIGH" || assessment.risk.riskLevel === "CRITICAL";
  const closed = asset.currentStage === "CASH_REALISED" || assessment.risk.riskLevel === "CLOSED" || capacity <= 0;
  const earlyStage = getStageIndex(ctx.stage) < getStageIndex("PRODUCTION");
  const paymentFriction = ctx.financial === "PAYMENT_DELAYED";
  const stale = staleDays(ctx) >= DECISION_THRESHOLDS.staleDaysHold;
  const lowConfidence = assessment.risk.dataConfidence < DECISION_THRESHOLDS.lowConfidenceHold;

  if (closed) {
    return {
      category: "NOT_CURRENTLY_PRIORITIZED",
      conditions: [],
      reviewItems: [],
      primaryReason:
        capacity <= 0
          ? "No incremental safe financing capacity remains on this twin."
          : "The financing lifecycle is closed after cash realisation.",
    };
  }

  if (highConflict || stale || lowConfidence) {
    const reviewItems: string[] = [];
    if (ctx.hasMismatch || ctx.openHighConflicts > 0) {
      reviewItems.push("Reconcile the open high-severity evidence conflict before any allocation.");
    }
    if (assessment.risk.riskLevel === "HIGH" || assessment.risk.riskLevel === "CRITICAL") {
      reviewItems.push("Review elevated Module 4 risk before treating this as deployable collateral.");
    }
    if (lowConfidence) reviewItems.push("Raise data confidence with a recent trusted operational update.");
    if (stale) reviewItems.push("Obtain a fresh verified event; critical data is stale.");
    return {
      category: "HOLD_FOR_REVIEW",
      conditions: [],
      reviewItems,
      primaryReason: reviewItems[0] ?? "Significant uncertainty requires a financing review hold.",
    };
  }

  const operationallyPriority =
    !earlyStage &&
    !paymentFriction &&
    opportunity.score >= DECISION_THRESHOLDS.priorityOpportunity &&
    readiness.score >= DECISION_THRESHOLDS.priorityReadiness &&
    assessment.risk.riskLevel !== "HIGH" &&
    assessment.risk.riskLevel !== "CRITICAL" &&
    capacity >= DECISION_THRESHOLDS.minimumPriorityCapacity &&
    (ctx.stage !== "PRODUCTION" || ctx.productionCompletion >= 50);

  if (operationallyPriority) {
    return {
      category: "PRIORITY_FUNDING",
      conditions: [],
      reviewItems: [],
      primaryReason: `Opportunity ${opportunity.score} and readiness ${readiness.score} support priority funding against ${assessment.financing.label.toLowerCase()}.`,
    };
  }

  if (
    opportunity.score >= DECISION_THRESHOLDS.conditionalOpportunity &&
    readiness.score >= DECISION_THRESHOLDS.conditionalReadiness &&
    assessment.risk.riskLevel !== "CRITICAL"
  ) {
    const conditions: string[] = [];
    if (earlyStage) conditions.push("Recommended subject to procurement / production commencement beyond the purchase-order desk.");
    if (ctx.stage === "PRODUCTION" && ctx.productionCompletion < 100) {
      conditions.push("Recommended subject to continued production verification through completion.");
    }
    if (asset.physical.verificationStatus === "PENDING_SYNC") {
      conditions.push("Recommended subject to completion of secondary verification.");
    }
    if (paymentFriction) conditions.push("Recommended subject to collection confirmation on the open receivable.");
    if (ctx.logistics === "DELAYED") conditions.push("Recommended subject to confirming the revised delivery window.");
    if (assessment.risk.riskLevel === "MEDIUM") conditions.push("Medium residual risk should be monitored through the next trusted event.");
    if (conditions.length === 0) {
      conditions.push("Recommended subject to a final operational check before capital is concentrated here.");
    }
    return {
      category: "CONDITIONAL_FUNDING",
      conditions,
      reviewItems: [],
      primaryReason: conditions[0],
    };
  }

  if (opportunity.score < DECISION_THRESHOLDS.conditionalOpportunity || readiness.score < 40 || capacity < 100_000) {
    return {
      category: "NOT_CURRENTLY_PRIORITIZED",
      conditions: [],
      reviewItems: [],
      primaryReason: "Opportunity, readiness, or evidence strength is insufficient to prioritize incremental capital.",
    };
  }

  return {
    category: "HOLD_FOR_REVIEW",
    conditions: [],
    reviewItems: ["Review residual uncertainty before including this asset in an allocation run."],
    primaryReason: "Significant uncertainty exists in the current evidence pack.",
  };
}
