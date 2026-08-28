import type { Asset } from "@/types/asset";
import type { IntelligenceContext, LTVRecommendation, IntelligenceRiskLevel } from "@/types/intelligence";
import { BASE_LTV, LTV_CEILING, LTV_FLOOR } from "@/lib/demo-data/risk-config";

export function recommendLTV(
  asset: Asset,
  level: IntelligenceRiskLevel,
  ctx: IntelligenceContext,
): LTVRecommendation {
  const baseLTV = BASE_LTV[level];
  if (level === "CLOSED") {
    return {
      assetId: asset.id,
      baseLTV: 0,
      adjustments: [],
      recommendedLTV: 0,
      explanation: "Cash realised. No incremental financing capacity.",
    };
  }
  const adjustments: LTVRecommendation["adjustments"] = [];

  if (ctx.dataConfidence >= 90) adjustments.push({ id: "conf-high", label: "High data confidence", deltaPct: 5 });
  else if (ctx.dataConfidence >= 70) adjustments.push({ id: "conf-mid", label: "Moderate data confidence", deltaPct: 2 });
  else adjustments.push({ id: "conf-low", label: "Low data confidence", deltaPct: -8 });

  if (ctx.verificationStatus === "VERIFIED" && (ctx.productionCompletion >= 100 || ctx.stage !== "PRODUCTION")) {
    adjustments.push({ id: "ver-full", label: "Fully verified", deltaPct: 4 });
  } else if (ctx.verificationStatus === "VERIFIED") {
    adjustments.push({ id: "ver-partial", label: "Verified with incomplete production", deltaPct: 1 });
  } else if (ctx.verificationStatus === "PENDING_SYNC") {
    adjustments.push({ id: "ver-pending", label: "Pending verification", deltaPct: -6 });
  }

  if (ctx.openHighConflicts > 0 || ctx.hasMismatch) {
    adjustments.push({ id: "conflict", label: "Open high-severity conflict", deltaPct: -10 });
  }

  const recommendedLTV = Math.max(
    LTV_FLOOR,
    Math.min(
      LTV_CEILING,
      Math.round(baseLTV + adjustments.reduce((sum, item) => sum + item.deltaPct, 0)),
    ),
  );

  const explanation = `Base LTV ${baseLTV}% for ${level} risk, then ${adjustments
    .map((item) => `${item.label} ${item.deltaPct >= 0 ? "+" : ""}${item.deltaPct}%`)
    .join(", ")}. Capped between ${LTV_FLOOR}% and ${LTV_CEILING}%.`;

  return { assetId: asset.id, baseLTV, adjustments, recommendedLTV, explanation };
}
