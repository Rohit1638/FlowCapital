import type { Asset, DataSource } from "@/types/asset";
import type { AssetDecisionRecord, PortfolioDecisionSummary } from "@/types/decisions";
import type { ConflictRecord, IntegrationEvent } from "@/types/integration";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { getSourcesForAsset } from "@/lib/demo-data/sources";
import { analyzeCapitalUnlock } from "@/lib/decisions/capital-unlock-engine";
import { recommendFunding } from "@/lib/decisions/decision-engine";
import { explainDecision } from "@/lib/decisions/decision-explainability";
import { scoreOpportunity } from "@/lib/decisions/opportunity-score-engine";
import { scoreFundingReadiness } from "@/lib/decisions/funding-readiness-engine";
import { rankDecisions } from "@/lib/decisions/prioritization-engine";
import { buildRecommendedActions } from "@/lib/decisions/recommended-actions";

export function summarizePortfolio(records: AssetDecisionRecord[]): PortfolioDecisionSummary {
  const priority = records.filter((item) => item.recommendation.category === "PRIORITY_FUNDING");
  const conditional = records.filter((item) => item.recommendation.category === "CONDITIONAL_FUNDING");
  const hold = records.filter((item) => item.recommendation.category === "HOLD_FOR_REVIEW");
  const notPrioritized = records.filter((item) => item.recommendation.category === "NOT_CURRENTLY_PRIORITIZED");
  const top = records[0];
  const topAction = records
    .flatMap((item) => item.actions)
    .find((item) => item.priority === "HIGH");

  return {
    totalSafeFinancing: records.reduce((sum, item) => sum + item.maximumSafeFinancing, 0),
    priorityFundingPotential: priority.reduce((sum, item) => sum + item.maximumSafeFinancing, 0),
    conditionalCapital: conditional.reduce((sum, item) => sum + item.maximumSafeFinancing, 0),
    blockedCapital: hold.reduce((sum, item) => sum + item.maximumSafeFinancing, 0),
    assetsReadyNow: records.filter((item) => item.readiness.band === "READY_NOW").length,
    assetsRequiringAttention: records.filter(
      (item) =>
        item.recommendation.category === "HOLD_FOR_REVIEW" ||
        item.riskLevel === "HIGH" ||
        item.riskLevel === "CRITICAL" ||
        item.actions.some((action) => action.priority === "HIGH"),
    ).length,
    priorityCount: priority.length,
    conditionalCount: conditional.length,
    holdCount: hold.length,
    notPrioritizedCount: notPrioritized.length,
    highestPriorityAction: topAction?.action ?? top?.explanation.primaryAction ?? "No immediate capital action.",
    topAssetId: top?.assetId ?? null,
  };
}

export function evaluateAssetDecision(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
  sources: DataSource[],
  portfolioMaxCapacity: number,
): AssetDecisionRecord {
  const opportunity = scoreOpportunity(asset, assessment, ctx, { maxSafeFinancing: portfolioMaxCapacity });
  const readiness = scoreFundingReadiness(asset, assessment, ctx);
  const recommendation = recommendFunding(asset, assessment, ctx, opportunity, readiness);
  const explanation = explainDecision(asset, assessment, ctx, opportunity, readiness, recommendation);
  const unlock = analyzeCapitalUnlock(
    asset,
    assessment,
    ctx,
    events,
    conflicts,
    sources,
    recommendation.category,
    portfolioMaxCapacity,
  );
  const actions = buildRecommendedActions(asset, assessment, ctx, recommendation, unlock.additionalCapitalUnlockable);

  return {
    assetId: asset.id,
    assetName: asset.name,
    stage: asset.currentStage,
    verificationStatus: asset.physical.verificationStatus,
    opportunity,
    readiness,
    recommendation,
    ranking: {
      assetId: asset.id,
      rank: 0,
      opportunityScore: opportunity.score,
      readinessScore: readiness.score,
      riskLevel: assessment.risk.riskLevel,
      maximumSafeFinancing: assessment.financing.maximumSafeFinancing,
      category: recommendation.category,
      primaryReason: recommendation.primaryReason,
    },
    explanation,
    actions,
    unlock,
    currentRealizableValue: assessment.valuation.currentRealizableValue,
    riskScore: assessment.risk.overallScore,
    riskLevel: assessment.risk.riskLevel,
    riskTrend: assessment.risk.trend,
    recommendedLTV: assessment.ltv.recommendedLTV,
    maximumSafeFinancing: assessment.financing.maximumSafeFinancing,
    dataConfidence: assessment.risk.dataConfidence,
  };
}

export function evaluatePortfolio(
  assets: Asset[],
  assessments: FinancialAssessment[],
  contexts: IntelligenceContext[],
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
): { records: AssetDecisionRecord[]; summary: PortfolioDecisionSummary } {
  const byId = new Map(assessments.map((item) => [item.assetId, item]));
  const ctxById = new Map(assets.map((asset, index) => [asset.id, contexts[index]]));
  const portfolioMaxCapacity = Math.max(1, ...assessments.map((item) => item.financing.maximumSafeFinancing));

  const records = rankDecisions(
    assets.map((asset) => {
      const assessment = byId.get(asset.id);
      const ctx = ctxById.get(asset.id);
      if (!assessment || !ctx) {
        throw new Error(`Missing financial assessment or context for ${asset.id}`);
      }
      return evaluateAssetDecision(asset, assessment, ctx, events, conflicts, getSourcesForAsset(asset.id), portfolioMaxCapacity);
    }),
  );

  return { records, summary: summarizePortfolio(records) };
}
