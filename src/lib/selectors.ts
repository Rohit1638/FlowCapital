import type { Asset, CapitalOverview, FinancialMovementPoint, LifecycleAggregate } from "@/types/asset";
import { LIFECYCLE_STAGES } from "@/types/asset";
import type { PortfolioRiskSnapshot } from "@/types/risk";
import { STAGE_SHORT_LABELS } from "@/lib/lifecycle";

export function isActiveBookAsset(asset: Asset): boolean {
  return asset.currentStage !== "CASH_REALISED" && asset.status !== "SETTLED";
}

export function deriveCapitalOverview(assets: Asset[]): CapitalOverview {
  const active = assets.filter(isActiveBookAsset);
  return {
    assetsUnderManagement: active.reduce((sum, asset) => sum + asset.currentValue, 0),
    aumChangePct: 4.2,
    capitalDeployed: assets.reduce((sum, asset) => sum + asset.financedAmount, 0),
    deployedChangePct: 2.4,
    availableFinancing: assets.reduce((sum, asset) => sum + asset.availableFinancing, 0),
    availableChangePct: 1.1,
    assetsRequiringAttention: assets.filter((asset) => asset.attention).length,
    attentionChangePct: 0,
  };
}

export function deriveLifecycleAggregates(assets: Asset[]): LifecycleAggregate[] {
  return LIFECYCLE_STAGES.map((stage) => {
    const stageAssets = assets.filter((asset) => asset.currentStage === stage);
    return {
      stage,
      assetCount: stageAssets.length,
      totalValue: stageAssets.reduce((sum, asset) => sum + asset.currentValue, 0),
      attention: stageAssets.some((asset) => asset.attention),
    };
  });
}

export function deriveFinancialMovement(assets: Asset[]): FinancialMovementPoint[] {
  return LIFECYCLE_STAGES.map((stage) => {
    const stageAssets = assets.filter((asset) => asset.currentStage === stage);
    return {
      label: STAGE_SHORT_LABELS[stage],
      assetValue: stageAssets.reduce((sum, asset) => sum + asset.currentValue, 0) / 10_000_000,
      capitalDeployed: stageAssets.reduce((sum, asset) => sum + asset.financedAmount, 0) / 10_000_000,
    };
  }).filter((point) => point.assetValue > 0 || point.capitalDeployed > 0);
}

export function derivePortfolioRisk(assets: Asset[]): PortfolioRiskSnapshot {
  const scored = assets.filter((asset) => asset.riskLevel !== "CLOSED");
  const averageScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((sum, asset) => sum + asset.riskScore, 0) / scored.length);

  return {
    averageScore,
    highRiskAssets: assets.filter((asset) => asset.riskLevel === "HIGH" || asset.riskLevel === "CRITICAL").length,
    overleveragedAssets: assets.filter((asset) => asset.financedAmount > asset.currentValue * 0.75 && asset.currentValue > 0)
      .length,
    concentrationNote: "Automotive WIP and warehouse machinery currently hold the largest financed exposure.",
  };
}

export function deriveIntelligenceMetrics(assets: Asset[]) {
  const active = assets.filter(isActiveBookAsset);
  return {
    totalTracked: assets.length,
    inMotion: assets.filter((asset) =>
      asset.currentStage === "IN_TRANSIT" || asset.currentStage === "PRODUCTION" || asset.currentStage === "PROCUREMENT",
    ).length,
    requiringAttention: assets.filter((asset) => asset.attention).length,
    totalValue: active.reduce((sum, asset) => sum + asset.currentValue, 0),
  };
}
