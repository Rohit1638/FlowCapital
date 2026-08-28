import type { Asset } from "@/types/asset";
import type { FundingRecommendation, RecommendedAction } from "@/types/decisions";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { formatCurrencyINR } from "@/lib/format";

export function buildRecommendedActions(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  recommendation: FundingRecommendation,
  potentialUnlock: number,
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (ctx.hasMismatch || ctx.openHighConflicts > 0) {
    actions.push({
      id: `${asset.id}-reconcile`,
      assetId: asset.id,
      priority: "HIGH",
      action: "Reconcile expected and actual warehouse quantity on the Digital Asset Twin.",
      whyItMatters: "Physical quantity is the collateral bound. A mismatch reduces confidence in available stock.",
      expectedImpact: `Resolving the mismatch can unlock additional safe financing of ${formatCurrencyINR(Math.max(potentialUnlock, 0), 2)}.`,
      potentialCapitalDelta: Math.max(potentialUnlock, 0),
    });
  }

  if (asset.physical.verificationStatus === "PENDING_SYNC") {
    actions.push({
      id: `${asset.id}-verify`,
      assetId: asset.id,
      priority: "HIGH",
      action: "Complete secondary quality or location verification.",
      whyItMatters: "Unverified progress keeps funding readiness in a conditional band.",
      expectedImpact: "Verification typically lifts readiness and recommended LTV together.",
      potentialCapitalDelta: 0,
    });
  }

  if (ctx.stage === "PRODUCTION" && ctx.productionCompletion < 100) {
    actions.push({
      id: `${asset.id}-production`,
      assetId: asset.id,
      priority: recommendation.category === "PRIORITY_FUNDING" ? "MEDIUM" : "HIGH",
      action: "Complete the next production verification milestone to improve funding readiness.",
      whyItMatters: "Module 4 realizable value and Module 5 opportunity both move with verified completion.",
      expectedImpact: "Verified production progress increases current realizable value and safe financing capacity.",
      potentialCapitalDelta: Math.max(potentialUnlock, 0),
    });
  }

  if (ctx.stage === "PURCHASE_ORDER" || ctx.stage === "PROCUREMENT") {
    actions.push({
      id: `${asset.id}-procure`,
      assetId: asset.id,
      priority: "MEDIUM",
      action: "Commence procurement and capture the first trusted operational event beyond the purchase order.",
      whyItMatters: "Priority funding requires operational evidence, not only a verified PO.",
      expectedImpact: "Moving past the PO desk can upgrade a conditional recommendation.",
      potentialCapitalDelta: 0,
    });
  }

  if (ctx.financial === "PAYMENT_DELAYED") {
    actions.push({
      id: `${asset.id}-collect`,
      assetId: asset.id,
      priority: "HIGH",
      action: "Confirm current collection status and a revised expected payment date.",
      whyItMatters: "Receivable financing depends on payment certainty more than physical completeness.",
      expectedImpact: "Clearing the delay can restore a stronger allocation priority.",
      potentialCapitalDelta: Math.max(potentialUnlock, 0),
    });
  }

  if (ctx.logistics === "DELAYED" || ctx.logistics === "SEVERELY_DELAYED") {
    actions.push({
      id: `${asset.id}-logistics`,
      assetId: asset.id,
      priority: "HIGH",
      action: "Confirm current shipment location and revised delivery status.",
      whyItMatters: "In-transit collateral needs a trusted location signal.",
      expectedImpact: "A clean logistics update reduces risk and can restore capacity.",
      potentialCapitalDelta: 0,
    });
  }

  if (assessment.risk.dataConfidence < 80) {
    actions.push({
      id: `${asset.id}-fresh`,
      assetId: asset.id,
      priority: "MEDIUM",
      action: "Obtain a recent trusted operational update from the relevant connector.",
      whyItMatters: "Stale or thin evidence lowers both Module 4 eligibility and Module 5 readiness.",
      expectedImpact: "Fresh trusted events raise data confidence without changing contractual value.",
      potentialCapitalDelta: 0,
    });
  }

  if (recommendation.category === "PRIORITY_FUNDING" && actions.length === 0) {
    actions.push({
      id: `${asset.id}-monitor`,
      assetId: asset.id,
      priority: "LOW",
      action: "Continue production and logistics monitoring and size any draw to the recommended financing capacity.",
      whyItMatters: "The evidence pack already supports priority treatment.",
      expectedImpact: `Keep deployment at or below ${formatCurrencyINR(assessment.financing.maximumSafeFinancing, 2)}.`,
      potentialCapitalDelta: 0,
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: `${asset.id}-review`,
      assetId: asset.id,
      priority: "LOW",
      action: "Keep this twin on the review list until opportunity or readiness improves.",
      whyItMatters: "There is no high-leverage operational action available from current evidence.",
      expectedImpact: "No incremental capital is recommended until the state changes.",
      potentialCapitalDelta: 0,
    });
  }

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]);
}
