import type { IntelligenceRiskLevel, RiskFactor, RiskFactorId } from "@/types/intelligence";
import type { IntelligenceContext } from "@/types/intelligence";
import { getStageIndex } from "@/lib/lifecycle";
import { LIFECYCLE_UNCERTAINTY, RISK_WEIGHTS } from "@/lib/demo-data/risk-config";
import { DEMO_AS_OF } from "@/lib/demo-data/valuation-config";

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function freshnessPoints(lastEventAt: string | null): number {
  if (!lastEventAt) return 4;
  const ageHours = Math.max(0, (new Date(DEMO_AS_OF).getTime() - new Date(lastEventAt).getTime()) / 3_600_000);
  if (ageHours < 24) return 0;
  if (ageHours < 72) return 1;
  if (ageHours < 168) return 3;
  return 5;
}

export function intelligenceRiskLevel(score: number, closed: boolean): IntelligenceRiskLevel {
  if (closed) return "CLOSED";
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

function productionLifecycle(completion: number): number {
  if (completion >= 100) return 12;
  if (completion >= 90) return 14;
  if (completion >= 80) return 17;
  return 20;
}

export function calculateRiskFactors(ctx: IntelligenceContext): RiskFactor[] {
  const stageIndex = getStageIndex(ctx.stage);
  const logisticsWeight =
    ctx.stage === "PRODUCTION" && ctx.attention ? 1 : stageIndex >= getStageIndex("IN_TRANSIT") ? 1 : 0.3;
  const financialWeight = stageIndex >= getStageIndex("INVOICE") ? 1 : 0.45;
  const operationalWeight = ctx.stage === "PRODUCTION" || ctx.stage === "RAW_MATERIAL" ? 1 : ctx.stage === "WAREHOUSE" ? 0.7 : 0.25;

  const lifecycleScore = ctx.stage === "PRODUCTION" ? productionLifecycle(ctx.productionCompletion) : LIFECYCLE_UNCERTAINTY[ctx.stage];

  let dataScore = 2;
  if (ctx.dataConfidence >= 90) dataScore = 2;
  else if (ctx.dataConfidence >= 70) dataScore = 7;
  else dataScore = 13;

  let verificationScore = 4;
  if (ctx.verificationStatus === "MISMATCH") verificationScore = 13;
  else if (ctx.verificationStatus === "PENDING_SYNC") verificationScore = 9;
  else if (ctx.verificationStatus === "VERIFIED") {
    verificationScore = ctx.hasAppliedQualityVerification || ctx.productionCompletion >= 100 || ctx.stage !== "PRODUCTION" ? 2 : 6;
  } else verificationScore = 3;

  let conflictScore = 0;
  if (ctx.hasMismatch || ctx.openHighConflicts > 0) conflictScore = 18;
  else if (ctx.openConflicts > 0) conflictScore = 8;

  let operationalScore = 2;
  if (ctx.stage === "PRODUCTION") {
    operationalScore = Math.round(((100 - ctx.productionCompletion) / 100) * 10);
    if (ctx.attention && ctx.productionCompletion < 100) operationalScore = Math.min(10, operationalScore + 2);
  }
  if (ctx.stage === "WAREHOUSE" && ctx.hasMismatch) operationalScore = 6;
  if (ctx.stage === "WAREHOUSE" && !ctx.hasMismatch) operationalScore = 4;

  const freshnessScore = freshnessPoints(ctx.lastEventAt);

  let logisticsScore = 1;
  if (ctx.logistics === "DELAYED") logisticsScore = 6;
  if (ctx.logistics === "SEVERELY_DELAYED") logisticsScore = 10;
  if (ctx.stage === "PRODUCTION" && ctx.attention) logisticsScore = Math.max(logisticsScore, 6);

  let financialScore = 4;
  if (ctx.financial === "PAYMENT_DELAYED") financialScore = 5;
  if (ctx.financial === "PAYMENT_RECEIVED") financialScore = 0;
  if (ctx.stage === "CASH_REALISED") financialScore = 0;

  const raw: { id: RiskFactorId; label: string; score: number; applicability: number; explanation: string }[] = [
    {
      id: "lifecycle",
      label: "Lifecycle risk",
      score: lifecycleScore,
      applicability: 1,
      explanation: `${ctx.stage.replaceAll("_", " ")} still carries prototype lifecycle uncertainty.`,
    },
    {
      id: "dataConfidence",
      label: "Data confidence risk",
      score: dataScore,
      applicability: 1,
      explanation: `Trusted event/source confidence is ${ctx.dataConfidence}%.`,
    },
    {
      id: "verification",
      label: "Verification risk",
      score: verificationScore,
      applicability: 1,
      explanation: `Physical verification status is ${ctx.verificationStatus.replaceAll("_", " ")}.`,
    },
    {
      id: "conflict",
      label: "Conflict risk",
      score: conflictScore,
      applicability: 1,
      explanation: ctx.hasMismatch
        ? "An unresolved physical-data conflict reduces confidence in the collateral."
        : "No open high-severity data conflicts.",
    },
    {
      id: "operational",
      label: "Operational progress risk",
      score: operationalScore,
      applicability: operationalWeight,
      explanation:
        ctx.stage === "PRODUCTION"
          ? `Production is ${ctx.productionCompletion}% complete. Incomplete WIP is not treated as failure.`
          : "Operational completion risk is limited at this stage.",
    },
    {
      id: "freshness",
      label: "Event freshness risk",
      score: freshnessScore,
      applicability: 1,
      explanation: "Measured against the stable demo clock of 28 Aug 2026.",
    },
    {
      id: "logistics",
      label: "Logistics risk",
      score: logisticsScore,
      applicability: logisticsWeight,
      explanation:
        ctx.stage === "PRODUCTION" && ctx.attention
          ? "A short raw-material delay is still affecting the production calendar."
          : logisticsWeight < 1
            ? "Shipment is not the primary risk driver before in-transit."
            : `Logistics status: ${ctx.logistics.replaceAll("_", " ")}.`,
    },
    {
      id: "financial",
      label: "Financial status risk",
      score: financialScore,
      applicability: financialWeight,
      explanation:
        financialWeight < 1
          ? "Payment risk has limited weight before invoicing."
          : `Financial status: ${ctx.financial.replaceAll("_", " ")}.`,
    },
  ];

  return raw.map((item) => {
    const max = RISK_WEIGHTS[item.id];
    const score = clamp(item.score * item.applicability, max);
    const midpoint = max * 0.35;
    return {
      id: item.id,
      label: item.label,
      score,
      max,
      applicable: item.applicability > 0.3,
      applicability: item.applicability,
      explanation: item.explanation,
      direction: score <= 1 ? "reduces" : score >= midpoint ? "increases" : "neutral",
    };
  });
}

export function overallRiskScore(factors: RiskFactor[]): number {
  return Math.min(100, factors.reduce((sum, factor) => sum + factor.score, 0));
}
