import type { AssetDecisionRecord, AllocationComparisonRow, CapitalAllocationInput, CapitalAllocationResult } from "@/types/decisions";
import { STRATEGY_ORDER } from "@/lib/demo-data/decision-config";
import { allocateCapital } from "@/lib/decisions/capital-allocation-engine";

export function simulateAllocation(
  decisions: AssetDecisionRecord[],
  input: CapitalAllocationInput,
): CapitalAllocationResult {
  return allocateCapital(decisions, input);
}

export function compareAllocationStrategies(
  decisions: AssetDecisionRecord[],
  availableCapital: number,
): AllocationComparisonRow[] {
  return STRATEGY_ORDER.map((strategy) => {
    const result = allocateCapital(decisions, { availableCapital, strategy });
    return {
      strategy,
      assetsFunded: result.assetsFunded,
      capitalDeployed: result.allocatedCapital,
      unallocatedCapital: result.unallocatedCapital,
      averageRiskLevel: result.averageRiskLevel,
      concentration: result.capitalConcentration,
    };
  });
}
