import type { Asset, DataSource } from "@/types/asset";
import type { ConflictRecord, IntegrationEvent } from "@/types/integration";
import type { FinancialAssessment, IntelligenceContext, SimulationInput } from "@/types/intelligence";
import { DEMO_RISK_PATHS } from "@/lib/demo-data/risk-config";
import { PRODUCTION_VALUE_ANCHORS } from "@/lib/demo-data/valuation-config";
import { DEMO_AS_OF } from "@/lib/demo-data/valuation-config";
import { buildRiskAlerts } from "@/lib/intelligence/alerts";
import { buildIntelligenceContext } from "@/lib/intelligence/context";
import { explainRisk } from "@/lib/intelligence/explainability";
import { financingCapacity } from "@/lib/intelligence/financing-engine";
import { recommendLTV } from "@/lib/intelligence/ltv-engine";
import { calculateRiskFactors, intelligenceRiskLevel, overallRiskScore } from "@/lib/intelligence/risk-factors";
import { riskTrend } from "@/lib/intelligence/risk-trend";
import { buildValuation } from "@/lib/intelligence/valuation-engine";

function previousRealizable(asset: Asset): number | null {
  if (asset.id !== "DA-2026-001") return null;
  const completion = asset.physical.productionCompletion;
  const anchors = PRODUCTION_VALUE_ANCHORS[asset.id];
  if (!anchors) return null;
  if (completion >= 100) return anchors.find((item) => item.completion === 80)?.value ?? 4_780_000;
  if (completion >= 80) return anchors.find((item) => item.completion === 65)?.value ?? 4_250_000;
  return null;
}

export function assessAsset(
  asset: Asset,
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
  sources: DataSource[],
  options?: { simulated?: boolean; context?: IntelligenceContext },
): FinancialAssessment {
  const ctx = options?.context ?? buildIntelligenceContext(asset, events, conflicts, sources);
  const factors = calculateRiskFactors(ctx);
  const score = overallRiskScore(factors);
  const closed = asset.currentStage === "CASH_REALISED";
  const level = intelligenceRiskLevel(score, closed);
  const explained = explainRisk(score, factors);
  const path = DEMO_RISK_PATHS[asset.id];
  const previousScore =
    asset.id === "DA-2026-001" && asset.physical.productionCompletion >= 80
      ? 42
      : path && path.length >= 2
        ? path[path.length - 2].score
        : null;
  const trend = riskTrend(previousScore, score);
  const valuation = buildValuation(asset, score, level, ctx.dataConfidence, previousRealizable(asset));
  const ltv = recommendLTV(asset, level, ctx);
  const financing = financingCapacity(asset, valuation, ltv);

  return {
    assetId: asset.id,
    asOf: DEMO_AS_OF,
    valuation,
    risk: {
      assetId: asset.id,
      overallScore: score,
      riskLevel: level,
      factors,
      trend: trend.direction,
      trendDelta: trend.delta,
      previousScore,
      primaryDrivers: explained.primaryDrivers,
      positiveSignals: explained.positiveSignals,
      alerts: buildRiskAlerts(asset.id, ctx, factors),
      explanation: explained.explanation,
      dataConfidence: ctx.dataConfidence,
      confidenceLevel: ctx.dataConfidence >= 85 ? "HIGH" : ctx.dataConfidence >= 65 ? "MEDIUM" : "LOW",
    },
    ltv,
    financing,
    simulated: Boolean(options?.simulated),
  };
}

export function applySimulationToAsset(asset: Asset, input: SimulationInput): Asset {
  const next = structuredClone(asset);
  if (input.productionCompletion !== undefined) {
    next.physical.productionCompletion = input.productionCompletion;
    if (next.currentStage === "PRODUCTION" && input.productionCompletion === 100) {
      next.attention = false;
    }
  }
  if (input.verificationStatus === "VERIFIED") next.physical.verificationStatus = "VERIFIED";
  if (input.verificationStatus === "PARTIALLY_VERIFIED") next.physical.verificationStatus = "PENDING_SYNC";
  if (input.verificationStatus === "PENDING") next.physical.verificationStatus = "PENDING_SYNC";
  if (input.conflictSeverity === "NONE") next.physical.verificationStatus = "VERIFIED";
  if (input.logisticsStatus === "DELAYED") next.physical.shipmentStatus = "Delayed";
  if (input.logisticsStatus === "SEVERELY_DELAYED") next.physical.shipmentStatus = "Severe delay";
  if (input.logisticsStatus === "NORMAL" && next.physical.shipmentStatus?.toLowerCase().includes("delay")) {
    next.physical.shipmentStatus = "On schedule";
  }
  return next;
}

export function simulateContext(base: IntelligenceContext, input: SimulationInput): IntelligenceContext {
  const next: IntelligenceContext = { ...base };
  if (input.productionCompletion !== undefined) next.productionCompletion = input.productionCompletion;
  if (input.verificationStatus === "VERIFIED") {
    next.verificationStatus = "VERIFIED";
    next.hasAppliedQualityVerification = true;
  }
  if (input.verificationStatus === "PARTIALLY_VERIFIED") next.verificationStatus = "PENDING_SYNC";
  if (input.verificationStatus === "PENDING") next.verificationStatus = "PENDING_SYNC";
  if (input.dataConfidence !== undefined) next.dataConfidence = input.dataConfidence;
  if (input.conflictSeverity === "NONE" || input.openConflictCount === 0) {
    next.hasMismatch = false;
    next.openConflicts = 0;
    next.openHighConflicts = 0;
  } else if (input.conflictSeverity) {
    next.hasMismatch = input.conflictSeverity === "HIGH";
    next.openConflicts = input.openConflictCount ?? 1;
    next.openHighConflicts = input.conflictSeverity === "HIGH" ? Math.max(1, input.openConflictCount ?? 1) : 0;
  }
  if (input.logisticsStatus) next.logistics = input.logisticsStatus;
  if (input.financialStatus) next.financial = input.financialStatus;
  if (input.productionCompletion !== undefined && input.productionCompletion >= 90) next.attention = false;
  return next;
}
