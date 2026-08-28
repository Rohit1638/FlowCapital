import type {
  AllocationItem,
  AllocationStrategy,
  AssetDecisionRecord,
  CapitalAllocationInput,
  CapitalAllocationResult,
} from "@/types/decisions";
import type { IntelligenceRiskLevel } from "@/types/intelligence";
import { ALLOCATION_RULES, STRATEGY_COPY } from "@/lib/demo-data/decision-config";
import { formatCurrencyINR } from "@/lib/format";

function riskLevelFromScore(score: number): IntelligenceRiskLevel {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

function eligible(record: AssetDecisionRecord, strategy: AllocationStrategy, includeConditional: boolean): boolean {
  if (record.maximumSafeFinancing <= 0) return false;
  if (record.recommendation.category === "PRIORITY_FUNDING") return true;
  if (record.recommendation.category === "HOLD_FOR_REVIEW") return ALLOCATION_RULES.holdEligible;
  if (record.recommendation.category === "NOT_CURRENTLY_PRIORITIZED") return ALLOCATION_RULES.notPrioritizedEligible;
  if (!includeConditional) return false;
  if (strategy === "LOWEST_RISK_FIRST") {
    return record.riskLevel === "LOW" && record.readiness.score >= ALLOCATION_RULES.lowestRiskConditionalMinReadiness;
  }
  if (strategy === "HIGHEST_OPPORTUNITY_FIRST") {
    return record.opportunity.score >= ALLOCATION_RULES.highestOpportunityConditionalMinScore;
  }
  return true;
}

function balancedScore(record: AssetDecisionRecord, maxCapacity: number): number {
  const capacityNorm = maxCapacity > 0 ? (record.maximumSafeFinancing / maxCapacity) * 100 : 0;
  const riskFlip = record.riskLevel === "CLOSED" ? 0 : Math.max(0, 100 - record.riskScore);
  return 0.35 * record.opportunity.score + 0.3 * record.readiness.score + 0.2 * riskFlip + 0.15 * capacityNorm;
}

function sortForStrategy(records: AssetDecisionRecord[], strategy: AllocationStrategy): AssetDecisionRecord[] {
  const maxCapacity = records.reduce((max, item) => Math.max(max, item.maximumSafeFinancing), 1);
  const copy = [...records];
  copy.sort((a, b) => {
    if (strategy === "BALANCED") return balancedScore(b, maxCapacity) - balancedScore(a, maxCapacity);
    if (strategy === "MAXIMIZE_SAFE_DEPLOYMENT") {
      if (b.maximumSafeFinancing !== a.maximumSafeFinancing) return b.maximumSafeFinancing - a.maximumSafeFinancing;
      return b.opportunity.score - a.opportunity.score;
    }
    if (strategy === "LOWEST_RISK_FIRST") {
      if (a.riskScore !== b.riskScore) return a.riskScore - b.riskScore;
      if (b.readiness.score !== a.readiness.score) return b.readiness.score - a.readiness.score;
      return b.opportunity.score - a.opportunity.score;
    }
    if (b.opportunity.score !== a.opportunity.score) return b.opportunity.score - a.opportunity.score;
    return b.readiness.score - a.readiness.score;
  });
  return copy;
}

function allocatePass(
  records: AssetDecisionRecord[],
  remaining: number,
  strategy: AllocationStrategy,
  availableCapital: number,
  used: Map<string, number>,
): number {
  const ordered = sortForStrategy(records, strategy);
  let left = remaining;
  for (const record of ordered) {
    if (left <= 0) break;
    const already = used.get(record.assetId) ?? 0;
    const headroom = record.maximumSafeFinancing - already;
    if (headroom <= 0) continue;
    const cap =
      strategy === "BALANCED" ? Math.max(0, Math.round(availableCapital * ALLOCATION_RULES.balancedMaxShare) - already) : headroom;
    const take = Math.min(left, headroom, cap > 0 ? cap : headroom);
    if (take <= 0) continue;
    used.set(record.assetId, already + take);
    left -= take;
  }
  return left;
}

export function allocateCapital(
  decisions: AssetDecisionRecord[],
  input: CapitalAllocationInput,
): CapitalAllocationResult {
  const availableCapital = Math.max(0, Math.round(input.availableCapital));
  const includeConditional = input.includeConditional ?? true;
  const used = new Map<string, number>();

  const priority = decisions.filter((item) => item.recommendation.category === "PRIORITY_FUNDING" && eligible(item, input.strategy, includeConditional));
  let remaining = allocatePass(priority, availableCapital, input.strategy, availableCapital, used);

  if (ALLOCATION_RULES.conditionalAfterPriority && includeConditional && remaining > 0) {
    const conditional = decisions.filter(
      (item) => item.recommendation.category === "CONDITIONAL_FUNDING" && eligible(item, input.strategy, true),
    );
    remaining = allocatePass(conditional, remaining, input.strategy, availableCapital, used);
  }

  const items: AllocationItem[] = decisions
    .map((record) => {
      const allocated = used.get(record.assetId) ?? 0;
      if (allocated <= 0 && record.recommendation.category !== "PRIORITY_FUNDING" && record.recommendation.category !== "CONDITIONAL_FUNDING") {
        return null;
      }
      if (allocated <= 0 && !eligible(record, input.strategy, includeConditional)) {
        return {
          assetId: record.assetId,
          assetName: record.assetName,
          category: record.recommendation.category,
          recommendedCapacity: record.maximumSafeFinancing,
          allocated: 0,
          opportunityScore: record.opportunity.score,
          readinessScore: record.readiness.score,
          riskLevel: record.riskLevel,
          reason: "Excluded by safety rules for this strategy.",
        } satisfies AllocationItem;
      }
      if (allocated <= 0) {
        return {
          assetId: record.assetId,
          assetName: record.assetName,
          category: record.recommendation.category,
          recommendedCapacity: record.maximumSafeFinancing,
          allocated: 0,
          opportunityScore: record.opportunity.score,
          readinessScore: record.readiness.score,
          riskLevel: record.riskLevel,
          reason: remaining <= 0 ? "Available capital was fully deployed earlier in the queue." : "No residual capacity was assigned under this strategy.",
        } satisfies AllocationItem;
      }
      return {
        assetId: record.assetId,
        assetName: record.assetName,
        category: record.recommendation.category,
        recommendedCapacity: record.maximumSafeFinancing,
        allocated,
        opportunityScore: record.opportunity.score,
        readinessScore: record.readiness.score,
        riskLevel: record.riskLevel,
        reason:
          allocated >= record.maximumSafeFinancing
            ? "Filled to recommended financing capacity."
            : "Partial allocation under concentration or remaining-capital limits.",
      } satisfies AllocationItem;
    })
    .filter((item): item is AllocationItem => item !== null)
    .sort((a, b) => b.allocated - a.allocated || a.assetId.localeCompare(b.assetId));

  const allocatedCapital = items.reduce((sum, item) => sum + item.allocated, 0);
  const unallocatedCapital = Math.max(0, availableCapital - allocatedCapital);
  const funded = items.filter((item) => item.allocated > 0);
  const weightedRisk =
    funded.reduce((sum, item) => {
      const record = decisions.find((row) => row.assetId === item.assetId);
      return sum + item.allocated * (record?.riskScore ?? 0);
    }, 0) / Math.max(allocatedCapital, 1);
  const largest = funded.reduce((max, item) => Math.max(max, item.allocated), 0);
  const concentration = allocatedCapital > 0 ? largest / allocatedCapital : 0;

  const unusedReason =
    unallocatedCapital <= 0
      ? "Available capital was fully deployed within recommended safe financing capacity."
      : funded.length === 0
        ? "No assets met the configured safety criteria for this strategy."
        : "Remaining capital was not deployed because no additional assets met the configured safety criteria.";

  const executiveSummary =
    funded.length === 0
      ? `Reserve ${formatCurrencyINR(availableCapital, 2)} until assets clear review holds and verification gaps.`
      : `Deploy ${formatCurrencyINR(allocatedCapital, 2)} across ${funded.length} high-readiness asset${funded.length === 1 ? "" : "s"} and reserve ${formatCurrencyINR(unallocatedCapital, 2)} pending verification and conflict resolution.`;

  return {
    strategy: input.strategy,
    availableCapital,
    allocatedCapital,
    unallocatedCapital,
    assetsFunded: funded.length,
    averagePortfolioRisk: Math.round(weightedRisk),
    averageRiskLevel: riskLevelFromScore(weightedRisk),
    capitalConcentration: Math.round(concentration * 100),
    items,
    unusedReason,
    executiveSummary: `${STRATEGY_COPY[input.strategy].name}: ${executiveSummary}`,
  };
}
