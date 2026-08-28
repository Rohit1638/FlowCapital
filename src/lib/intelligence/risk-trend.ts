import type { Asset } from "@/types/asset";
import type { RiskSnapshot } from "@/types/risk";
import type { RiskTrendDirection } from "@/types/intelligence";
import { DEMO_RISK_PATHS } from "@/lib/demo-data/risk-config";
import { intelligenceRiskLevel } from "@/lib/intelligence/risk-factors";
import { DEMO_AS_OF } from "@/lib/demo-data/valuation-config";

export function riskTrend(previous: number | null, current: number): { direction: RiskTrendDirection; delta: number } {
  if (previous === null) return { direction: "STABLE", delta: 0 };
  const delta = current - previous;
  if (delta <= -3) return { direction: "IMPROVING", delta };
  if (delta >= 3) return { direction: "WORSENING", delta };
  return { direction: "STABLE", delta };
}

export function historicalSnapshots(asset: Asset, currentScore: number): RiskSnapshot[] {
  const path = DEMO_RISK_PATHS[asset.id] ?? [];
  const points: RiskSnapshot[] = path.map((item, index) => ({
    id: `${asset.id}-intel-${index}`,
    assetId: asset.id,
    score: item.score,
    level: intelligenceRiskLevel(item.score, false),
    reason: item.reason,
    timestamp: item.timestamp,
  }));

  if (asset.id === "DA-2026-001") {
    if (asset.physical.productionCompletion >= 80) {
      points.push({
        id: `${asset.id}-intel-80`,
        assetId: asset.id,
        score: currentScore,
        level: intelligenceRiskLevel(currentScore, false),
        reason: asset.currentStage === "FINISHED_GOODS" ? "Finished goods confirmed from trusted events." : "Production advanced with verified MES progress.",
        timestamp: asset.lastUpdated,
      });
    } else if (points.length > 0) {
      points[points.length - 1] = {
        ...points[points.length - 1],
        score: currentScore,
        level: intelligenceRiskLevel(currentScore, false),
      };
    }
  } else if (points.length > 0) {
    points[points.length - 1] = {
      ...points[points.length - 1],
      score: currentScore,
      level: intelligenceRiskLevel(currentScore, asset.currentStage === "CASH_REALISED"),
      timestamp: asset.lastUpdated || DEMO_AS_OF,
    };
  } else {
    points.push({
      id: `${asset.id}-intel-now`,
      assetId: asset.id,
      score: currentScore,
      level: intelligenceRiskLevel(currentScore, asset.currentStage === "CASH_REALISED"),
      reason: "Current decision-support assessment.",
      timestamp: asset.lastUpdated || DEMO_AS_OF,
    });
  }

  return points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
