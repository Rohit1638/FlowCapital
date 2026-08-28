import type { AssetDecisionRecord, PriorityRanking } from "@/types/decisions";
import { DECISION_CATEGORY_ORDER } from "@/lib/demo-data/decision-config";

export function comparePriority(a: AssetDecisionRecord, b: AssetDecisionRecord): number {
  const byCategory = DECISION_CATEGORY_ORDER[a.recommendation.category] - DECISION_CATEGORY_ORDER[b.recommendation.category];
  if (byCategory !== 0) return byCategory;
  if (b.opportunity.score !== a.opportunity.score) return b.opportunity.score - a.opportunity.score;
  if (b.readiness.score !== a.readiness.score) return b.readiness.score - a.readiness.score;
  if (b.maximumSafeFinancing !== a.maximumSafeFinancing) return b.maximumSafeFinancing - a.maximumSafeFinancing;
  return a.assetId.localeCompare(b.assetId);
}

export function rankDecisions(records: AssetDecisionRecord[]): AssetDecisionRecord[] {
  const sorted = [...records].sort(comparePriority);
  return sorted.map((record, index) => {
    const ranking: PriorityRanking = {
      assetId: record.assetId,
      rank: index + 1,
      opportunityScore: record.opportunity.score,
      readinessScore: record.readiness.score,
      riskLevel: record.riskLevel,
      maximumSafeFinancing: record.maximumSafeFinancing,
      category: record.recommendation.category,
      primaryReason: record.recommendation.primaryReason,
    };
    return { ...record, ranking };
  });
}
