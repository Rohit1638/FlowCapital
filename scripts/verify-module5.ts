import { baseAssets } from "../src/lib/demo-data/assets";
import { seedConflicts, seedIntegrationEvents } from "../src/lib/demo-data/integration-events";
import { getSourcesForAsset } from "../src/lib/demo-data/sources";
import { buildIntelligenceContext } from "../src/lib/intelligence/context";
import { assessAsset } from "../src/lib/intelligence/assess";
import { evaluatePortfolio } from "../src/lib/decisions/portfolio-decision-engine";
import { allocateCapital } from "../src/lib/decisions/capital-allocation-engine";
import { compareAllocationStrategies } from "../src/lib/simulation/capital-allocation-simulator";
import { STRATEGY_ORDER } from "../src/lib/demo-data/decision-config";

function main() {
  const events = seedIntegrationEvents;
  const conflicts = seedConflicts;
  const assessments = baseAssets.map((asset) => assessAsset(asset, events, conflicts, getSourcesForAsset(asset.id)));
  const contexts = baseAssets.map((asset) => buildIntelligenceContext(asset, events, conflicts, getSourcesForAsset(asset.id)));
  const { records, summary } = evaluatePortfolio(baseAssets, assessments, contexts, events, conflicts);

  console.log("=== MODULE 5 DECISION MIX ===");
  for (const record of records) {
    console.log(
      `#${record.ranking.rank} ${record.assetId} opp=${record.opportunity.score} ready=${record.readiness.score} risk=${record.riskLevel}/${record.riskScore} cap=${record.maximumSafeFinancing} ${record.recommendation.category}`,
    );
  }
  console.log("summary", {
    priority: summary.priorityCount,
    conditional: summary.conditionalCount,
    hold: summary.holdCount,
    not: summary.notPrioritizedCount,
    totalSafe: summary.totalSafeFinancing,
    blocked: summary.blockedCapital,
  });

  const three = records.find((item) => item.assetId === "DA-2026-003");
  if (!three || three.recommendation.category !== "HOLD_FOR_REVIEW") {
    throw new Error(`DA-2026-003 should be HOLD_FOR_REVIEW, got ${three?.recommendation.category}`);
  }
  if (three.unlock.additionalCapitalUnlockable <= 0) {
    throw new Error("DA-2026-003 should unlock additional capital when mismatch is simulated away");
  }

  const eight = records.find((item) => item.assetId === "DA-2026-008");
  if (!eight || eight.recommendation.category !== "NOT_CURRENTLY_PRIORITIZED") {
    throw new Error(`DA-2026-008 should be NOT_CURRENTLY_PRIORITIZED, got ${eight?.recommendation.category}`);
  }

  if (summary.priorityCount < 2 || summary.priorityCount > 3) {
    throw new Error(`Expected 2-3 PRIORITY_FUNDING, got ${summary.priorityCount}`);
  }
  if (summary.conditionalCount < 2 || summary.conditionalCount > 3) {
    throw new Error(`Expected 2-3 CONDITIONAL_FUNDING, got ${summary.conditionalCount}`);
  }
  if (summary.holdCount < 1) throw new Error("Expected at least 1 HOLD_FOR_REVIEW");
  if (summary.notPrioritizedCount < 1) throw new Error("Expected at least 1 NOT_CURRENTLY_PRIORITIZED");

  const capital = 10_000_000;
  for (const strategy of STRATEGY_ORDER) {
    const result = allocateCapital(records, { availableCapital: capital, strategy });
    if (result.allocatedCapital > capital) throw new Error(`${strategy} exceeded available capital`);
    for (const item of result.items) {
      const record = records.find((row) => row.assetId === item.assetId);
      if (!record) continue;
      if (item.allocated > record.maximumSafeFinancing) {
        throw new Error(`${strategy} allocated more than safe capacity to ${item.assetId}`);
      }
      if (item.assetId === "DA-2026-003" && item.allocated > 0) {
        throw new Error("DA-2026-003 should be excluded from default allocation");
      }
    }
    console.log(strategy, {
      funded: result.assetsFunded,
      allocated: result.allocatedCapital,
      unallocated: result.unallocatedCapital,
      risk: result.averageRiskLevel,
      names: result.items.filter((item) => item.allocated > 0).map((item) => `${item.assetId}:${item.allocated}`),
    });
  }

  const comparison = compareAllocationStrategies(records, capital);
  const unique = new Set(comparison.map((row) => `${row.capitalDeployed}-${row.assetsFunded}`));
  if (unique.size < 2) {
    console.warn("Strategy comparison produced very similar books; check ranking diversity.");
  }

  console.log("MODULE 5 VERIFY OK");
}

main();
