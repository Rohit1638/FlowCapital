import type { Asset } from "@/types/asset";
import type { FinancingOpportunityScore, FundingReadiness, FundingRecommendation } from "@/types/decisions";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { DECISION_HEADLINES, DECISION_LABELS } from "@/lib/demo-data/decision-config";
import { evaluateDecisionRules } from "@/lib/decisions/decision-rules";

export function recommendFunding(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  opportunity: FinancingOpportunityScore,
  readiness: FundingReadiness,
): FundingRecommendation {
  const hit = evaluateDecisionRules(asset, assessment, ctx, opportunity, readiness);
  return {
    assetId: asset.id,
    category: hit.category,
    label: DECISION_LABELS[hit.category],
    headline: DECISION_HEADLINES[hit.category],
    conditions: hit.conditions,
    reviewItems: hit.reviewItems,
    primaryReason: hit.primaryReason,
  };
}
