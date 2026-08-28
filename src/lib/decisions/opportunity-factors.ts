import type { Asset } from "@/types/asset";
import type { OpportunityFactor, OpportunityFactorId } from "@/types/decisions";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import {
  CAPACITY_MATURITY_MULTIPLIER,
  MATURITY_POINTS,
  OPPORTUNITY_FACTOR_LABELS,
  OPPORTUNITY_WEIGHTS,
  RISK_OPPORTUNITY_POINTS,
  VERIFICATION_OPPORTUNITY_POINTS,
} from "@/lib/demo-data/decision-config";
import { formatCurrencyINR } from "@/lib/format";
import { getStageIndex } from "@/lib/lifecycle";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export interface OpportunityPortfolioRef {
  maxSafeFinancing: number;
}

function conflictPoints(ctx: IntelligenceContext): { points: number; explanation: string } {
  if (ctx.hasMismatch || ctx.openHighConflicts > 0) {
    return {
      points: 1,
      explanation: "High-severity or quantity conflict remains open, so conflict contribution is minimal.",
    };
  }
  if (ctx.openConflicts > 0) {
    return {
      points: 5,
      explanation: "A manageable open conflict reduces conflict contribution.",
    };
  }
  return { points: OPPORTUNITY_WEIGHTS.conflict, explanation: "No open conflicts on trusted evidence." };
}

function maturityPoints(asset: Asset, ctx: IntelligenceContext): { points: number; explanation: string } {
  let points = MATURITY_POINTS[ctx.stage];
  if (ctx.stage === "PRODUCTION") {
    points = 2.2 + 2.6 * (ctx.productionCompletion / 100);
  }
  if (ctx.financial === "PAYMENT_DELAYED") points = Math.max(1.5, points - 1.2);
  if (ctx.stage === "INVOICE" || ctx.stage === "RECEIVABLE") {
    points = ctx.financial === "PAYMENT_RECEIVED" ? 4.8 : points;
  }
  return {
    points: clamp(points, 0, OPPORTUNITY_WEIGHTS.maturity),
    explanation: `${asset.currentStage.replaceAll("_", " ")} is ${getStageIndex(ctx.stage) >= 4 ? "operationally mature" : "still early in the financing lifecycle"}.`,
  };
}

export function buildOpportunityFactors(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  portfolio: OpportunityPortfolioRef,
): OpportunityFactor[] {
  const capacity = assessment.financing.maximumSafeFinancing;
  const maxCapacity = Math.max(portfolio.maxSafeFinancing, 1);
  const ratio = clamp(capacity / maxCapacity, 0, 1);
  const productionBoost = ctx.stage === "PRODUCTION" ? 0.08 * (ctx.productionCompletion / 100) : 0;
  const capacityPoints =
    OPPORTUNITY_WEIGHTS.capacity *
    Math.sqrt(ratio) *
    clamp(CAPACITY_MATURITY_MULTIPLIER[ctx.stage] + productionBoost, 0, 1);

  const riskPoints = RISK_OPPORTUNITY_POINTS[assessment.risk.riskLevel];
  const confidencePoints = OPPORTUNITY_WEIGHTS.confidence * (assessment.risk.dataConfidence / 100);
  const verificationPoints = VERIFICATION_OPPORTUNITY_POINTS[asset.physical.verificationStatus];
  const conflict = conflictPoints(ctx);
  const maturity = maturityPoints(asset, ctx);
  const efficiencyRatio =
    assessment.valuation.currentRealizableValue > 0
      ? clamp(capacity / assessment.valuation.currentRealizableValue, 0, 1)
      : 0;
  const efficiencyPoints = OPPORTUNITY_WEIGHTS.efficiency * efficiencyRatio;

  const specs: { id: OpportunityFactorId; points: number; explanation: string }[] = [
    {
      id: "capacity",
      points: capacityPoints,
      explanation: `Safe financing of ${formatCurrencyINR(capacity, 2)} is scored against the portfolio, not raw asset size.`,
    },
    {
      id: "risk",
      points: riskPoints,
      explanation: `${assessment.risk.riskLevel} risk (${assessment.risk.overallScore}/100) converts to ${round1(riskPoints)} opportunity points.`,
    },
    {
      id: "confidence",
      points: confidencePoints,
      explanation: `Data confidence ${assessment.risk.dataConfidence}% from trusted Module 3 evidence.`,
    },
    {
      id: "verification",
      points: verificationPoints,
      explanation: `Verification status ${asset.physical.verificationStatus.replaceAll("_", " ")}.`,
    },
    {
      id: "conflict",
      points: conflict.points,
      explanation: conflict.explanation,
    },
    {
      id: "maturity",
      points: maturity.points,
      explanation: maturity.explanation,
    },
    {
      id: "efficiency",
      points: efficiencyPoints,
      explanation: "Potential safe financing relative to current realizable value. Supporting factor only.",
    },
  ];

  return specs.map((item) => ({
    id: item.id,
    label: OPPORTUNITY_FACTOR_LABELS[item.id],
    weight: OPPORTUNITY_WEIGHTS[item.id],
    points: round1(clamp(item.points, 0, OPPORTUNITY_WEIGHTS[item.id])),
    max: OPPORTUNITY_WEIGHTS[item.id],
    explanation: item.explanation,
  }));
}
