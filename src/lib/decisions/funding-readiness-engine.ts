import type { Asset } from "@/types/asset";
import type { FundingReadiness, FundingReadinessBand } from "@/types/decisions";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { DEMO_AS_OF } from "@/lib/demo-data/valuation-config";
import { READINESS_BANDS, READINESS_WEIGHTS } from "@/lib/demo-data/decision-config";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function bandFor(score: number): FundingReadinessBand {
  const match = READINESS_BANDS.find((item) => score >= item.min);
  return match?.band ?? "NOT_READY";
}

function freshnessPoints(ctx: IntelligenceContext): { points: number; explanation: string } {
  if (!ctx.lastEventAt) {
    return { points: 4, explanation: "No recent trusted event timestamp is available." };
  }
  const days = Math.max(0, (new Date(DEMO_AS_OF).getTime() - new Date(ctx.lastEventAt).getTime()) / 86_400_000);
  if (days <= 3) return { points: READINESS_WEIGHTS.freshness, explanation: "Trusted operational data is current." };
  if (days <= 10) return { points: 7, explanation: "Evidence is recent but not intra-day fresh." };
  if (days <= 21) return { points: 4, explanation: "Evidence is ageing and should be refreshed." };
  return { points: 1.5, explanation: "Critical operational data is stale." };
}

function verificationPoints(asset: Asset): { points: number; explanation: string } {
  switch (asset.physical.verificationStatus) {
    case "VERIFIED":
      return { points: READINESS_WEIGHTS.verification, explanation: "Physical state is verified." };
    case "PENDING_SYNC":
      return { points: 10, explanation: "Secondary verification is still pending." };
    case "MISMATCH":
      return { points: 3, explanation: "Verification failed a quantity or location check." };
    default:
      return { points: 8, explanation: "Verification is not applicable at this lifecycle stage." };
  }
}

function conflictReadiness(ctx: IntelligenceContext): { points: number; explanation: string } {
  if (ctx.hasMismatch || ctx.openHighConflicts > 0) {
    return { points: 3, explanation: "A high-severity evidence conflict blocks funding readiness." };
  }
  if (ctx.openConflicts > 0) {
    return { points: 12, explanation: "An open but lower-severity conflict still requires clearance." };
  }
  return { points: READINESS_WEIGHTS.conflict, explanation: "No open conflicts." };
}

function riskReadiness(assessment: FinancialAssessment): { points: number; explanation: string } {
  switch (assessment.risk.riskLevel) {
    case "LOW":
      return { points: READINESS_WEIGHTS.risk, explanation: "Risk is within the low band." };
    case "MEDIUM":
      return { points: 13, explanation: "Medium residual risk keeps readiness below the top band." };
    case "HIGH":
      return { points: 5, explanation: "High risk reduces funding readiness." };
    case "CRITICAL":
      return { points: 1, explanation: "Critical risk makes the asset unready for allocation." };
    default:
      return { points: 6, explanation: "The financing lifecycle is closed." };
  }
}

function lifecycleReadiness(ctx: IntelligenceContext): { points: number; explanation: string } {
  const table: Record<string, number> = {
    PURCHASE_ORDER: 2,
    PROCUREMENT: 3,
    RAW_MATERIAL: 4.5,
    PRODUCTION: 6 + 3.5 * (ctx.productionCompletion / 100),
    FINISHED_GOODS: 10,
    IN_TRANSIT: 9,
    WAREHOUSE: 8,
    DELIVERED: 10,
    INVOICE: 9,
    RECEIVABLE: 8,
    CASH_REALISED: 2,
  };
  let points = table[ctx.stage] ?? 4;
  if (ctx.financial === "PAYMENT_DELAYED") points = Math.max(2, points - 3);
  if (ctx.logistics === "DELAYED") points = Math.max(2, points - 2);
  if (ctx.logistics === "SEVERELY_DELAYED") points = Math.max(1, points - 4);
  return {
    points: clamp(points, 0, READINESS_WEIGHTS.lifecycle),
    explanation: "Lifecycle maturity and operational exceptions determine whether capital can move now.",
  };
}

export function scoreFundingReadiness(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
): FundingReadiness {
  const verification = verificationPoints(asset);
  const conflict = conflictReadiness(ctx);
  const freshness = freshnessPoints(ctx);
  const risk = riskReadiness(assessment);
  const confidence = {
    points: READINESS_WEIGHTS.confidence * (assessment.risk.dataConfidence / 100),
    explanation: `Confidence ${assessment.risk.dataConfidence}% from Module 3 / Module 4 evidence.`,
  };
  const lifecycle = lifecycleReadiness(ctx);

  const components = [
    { id: "verification", label: "Verification", ...verification, max: READINESS_WEIGHTS.verification },
    { id: "conflict", label: "Conflicts", ...conflict, max: READINESS_WEIGHTS.conflict },
    { id: "freshness", label: "Data freshness", ...freshness, max: READINESS_WEIGHTS.freshness },
    { id: "risk", label: "Risk", ...risk, max: READINESS_WEIGHTS.risk },
    { id: "confidence", label: "Confidence", ...confidence, max: READINESS_WEIGHTS.confidence },
    { id: "lifecycle", label: "Lifecycle maturity", ...lifecycle, max: READINESS_WEIGHTS.lifecycle },
  ].map((item) => ({
    ...item,
    points: round1(clamp(item.points, 0, item.max)),
  }));

  const score = clamp(Math.round(components.reduce((sum, item) => sum + item.points, 0)), 0, 100);
  const band = bandFor(score);

  return {
    assetId: asset.id,
    score,
    band,
    components,
    summary: `Funding readiness ${score}/100 · ${band.replaceAll("_", " ")}.`,
  };
}
