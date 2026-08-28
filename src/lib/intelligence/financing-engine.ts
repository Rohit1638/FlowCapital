import type { Asset } from "@/types/asset";
import type { AssetValuation, FinancingCapacity, LTVRecommendation } from "@/types/intelligence";
import { FINANCING_DISCLAIMER, FINANCING_LABEL } from "@/lib/demo-data/financing-config";

export function financingCapacity(asset: Asset, valuation: AssetValuation, ltv: LTVRecommendation): FinancingCapacity {
  const maximumSafeFinancing = Math.round(valuation.financingEligibleValue * (ltv.recommendedLTV / 100));
  const alreadyFinanced = asset.financedAmount;
  return {
    assetId: asset.id,
    currentRealizableValue: valuation.currentRealizableValue,
    riskAdjustedValue: valuation.riskAdjustedValue,
    financingEligibleValue: valuation.financingEligibleValue,
    recommendedLTV: ltv.recommendedLTV,
    maximumSafeFinancing,
    alreadyFinanced,
    unusedCapacity: Math.max(0, maximumSafeFinancing - alreadyFinanced),
    label: FINANCING_LABEL,
    disclaimer: FINANCING_DISCLAIMER,
  };
}
