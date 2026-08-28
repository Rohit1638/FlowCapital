import type { Asset, LifecycleStage } from "@/types/asset";
import type { AssetValuation, IntelligenceRiskLevel, ValuationStep } from "@/types/intelligence";
import {
  FINISHED_GOODS_ANCHORS,
  PRODUCTION_VALUE_ANCHORS,
  RISK_ADJUSTMENT_BY_LEVEL,
  STAGE_REALIZABLE_BAND,
  VALUATION_DISCLAIMER,
} from "@/lib/demo-data/valuation-config";

export function interpolateAnchors(
  anchors: { completion: number; value: number }[],
  completion: number,
): number {
  const sorted = [...anchors].sort((a, b) => a.completion - b.completion);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return 0;
  if (completion <= first.completion) return first.value;
  if (completion >= last.completion) return last.value;
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const from = sorted[index];
    const to = sorted[index + 1];
    if (!from || !to) continue;
    if (completion >= from.completion && completion <= to.completion) {
      const span = to.completion - from.completion || 1;
      const t = (completion - from.completion) / span;
      return Math.round(from.value + t * (to.value - from.value));
    }
  }
  return last.value;
}

function bandPct(stage: LifecycleStage, verified: boolean, completion: number): number {
  const band = STAGE_REALIZABLE_BAND[stage];
  if (stage === "PRODUCTION") {
    return band.min + (completion / 100) * (band.max - band.min);
  }
  return verified ? band.max : (band.min + band.max) / 2;
}

export function currentRealizableValue(asset: Asset): number {
  if (asset.currentStage === "CASH_REALISED") return 0;

  if (asset.currentStage === "FINISHED_GOODS" && FINISHED_GOODS_ANCHORS[asset.id]) {
    return FINISHED_GOODS_ANCHORS[asset.id];
  }

  if (asset.currentStage === "PRODUCTION") {
    const anchors = PRODUCTION_VALUE_ANCHORS[asset.id];
    if (anchors) return interpolateAnchors(anchors, asset.physical.productionCompletion);
  }

  const verified = asset.physical.verificationStatus === "VERIFIED";
  const pct = bandPct(asset.currentStage, verified, asset.physical.productionCompletion);
  return Math.round(asset.originalValue * pct);
}

export function riskAdjustmentFactor(score: number, level: IntelligenceRiskLevel): number {
  if (level === "CLOSED") return 1;
  const band = RISK_ADJUSTMENT_BY_LEVEL[level];
  const ranges: Record<Exclude<IntelligenceRiskLevel, "CLOSED">, { lo: number; hi: number }> = {
    LOW: { lo: 0, hi: 25 },
    MEDIUM: { lo: 26, hi: 50 },
    HIGH: { lo: 51, hi: 75 },
    CRITICAL: { lo: 76, hi: 100 },
  };
  const { lo, hi } = ranges[level];
  const t = Math.min(1, Math.max(0, (score - lo) / (hi - lo || 1)));
  return Number((band.max - t * (band.max - band.min)).toFixed(4));
}

export function valueAtProduction(assetId: string, originalValue: number, completion: number): number {
  const anchors = PRODUCTION_VALUE_ANCHORS[assetId];
  if (anchors) return interpolateAnchors(anchors, completion);
  const band = STAGE_REALIZABLE_BAND.PRODUCTION;
  const pct = band.min + (completion / 100) * (band.max - band.min);
  return Math.round(originalValue * pct);
}

export function buildValuation(
  asset: Asset,
  score: number,
  level: IntelligenceRiskLevel,
  dataConfidencePct: number,
  previousRealizable: number | null,
): AssetValuation {
  const contractualValue = asset.originalValue;
  const current = currentRealizableValue(asset);
  const factor = riskAdjustmentFactor(score, level);
  const riskAdjustedValue = Math.round(current * factor);
  const dataConfidenceAdjustment = Math.max(0.5, Math.min(1, dataConfidencePct / 100));
  const financingEligibleValue = Math.round(riskAdjustedValue * dataConfidenceAdjustment);
  const verifiedProgress = Math.round(contractualValue * (asset.physical.productionCompletion / 100));

  const steps: ValuationStep[] =
    asset.currentStage === "PRODUCTION"
      ? [
          { label: "Contractual value", value: contractualValue, note: "Purchase-order / goods value on the twin." },
          {
            label: `Production progress ${asset.physical.productionCompletion}%`,
            value: verifiedProgress,
            note: "Verified production component used for the prototype recoverable value.",
          },
          { label: "Current realizable value", value: current, note: "Lifecycle-aware estimate after production progress." },
        ]
      : [
          { label: "Contractual value", value: contractualValue, note: "Original PO / invoice / goods value." },
          {
            label: "Lifecycle recoverable band",
            value: current,
            note: `${asset.currentStage.replaceAll("_", " ")} recoverable range applied.`,
          },
        ];

  return {
    assetId: asset.id,
    contractualValue,
    currentRealizableValue: current,
    riskAdjustedValue,
    financingEligibleValue,
    riskAdjustmentFactor: factor,
    dataConfidenceAdjustment,
    previousRealizableValue: previousRealizable,
    realizableDelta: previousRealizable === null ? 0 : current - previousRealizable,
    steps,
    methodologyNote: VALUATION_DISCLAIMER,
  };
}
