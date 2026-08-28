import type { Asset, DataSource } from "@/types/asset";
import type { CapitalUnlockOpportunity, DecisionCategory } from "@/types/decisions";
import type { ConflictRecord, IntegrationEvent } from "@/types/integration";
import type { FinancialAssessment, IntelligenceContext, SimulationInput } from "@/types/intelligence";
import { formatCurrencyINR } from "@/lib/format";
import { recommendFunding } from "@/lib/decisions/decision-engine";
import { scoreOpportunity } from "@/lib/decisions/opportunity-score-engine";
import { scoreFundingReadiness } from "@/lib/decisions/funding-readiness-engine";
import { applySimulationToAsset, simulateContext } from "@/lib/intelligence/assess";
import { runSimulation } from "@/lib/simulation/financial-simulator";

export function unlockSimulationInput(ctx: IntelligenceContext): { input: SimulationInput; blocker: string; action: string } | null {
  if (ctx.hasMismatch || ctx.openHighConflicts > 0) {
    return {
      input: { conflictSeverity: "NONE", openConflictCount: 0, verificationStatus: "VERIFIED" },
      blocker: "High-severity quantity mismatch between expected and actual records.",
      action: "Reconcile the discrepancy between production and warehouse quantity, then re-verify the twin.",
    };
  }
  if (ctx.verificationStatus === "PENDING_SYNC") {
    return {
      input: { verificationStatus: "VERIFIED", dataConfidence: Math.max(ctx.dataConfidence, 90) },
      blocker: "Secondary verification is still pending.",
      action: "Complete secondary quality or location verification.",
    };
  }
  if (ctx.stage === "PRODUCTION" && ctx.productionCompletion < 100) {
    return {
      input: { productionCompletion: 100, verificationStatus: "VERIFIED" },
      blocker: `Production is ${ctx.productionCompletion}% complete.`,
      action: "Complete the remaining production verification milestone through finished goods.",
    };
  }
  if (ctx.financial === "PAYMENT_DELAYED") {
    return {
      input: { financialStatus: "PAYMENT_RECEIVED" },
      blocker: "Buyer payment delay on the open receivable.",
      action: "Confirm collection or a firm revised payment date.",
    };
  }
  if (ctx.logistics === "DELAYED" || ctx.logistics === "SEVERELY_DELAYED") {
    return {
      input: { logisticsStatus: "NORMAL" },
      blocker: "Shipment delay detected on the current logistics path.",
      action: "Confirm current location and a clean delivery window.",
    };
  }
  if (ctx.dataConfidence < 80) {
    return {
      input: { dataConfidence: 92 },
      blocker: "Data confidence is below the funding-ready threshold.",
      action: "Obtain a recent trusted operational update.",
    };
  }
  return null;
}

function categoryFromSimulated(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  maxCapacity: number,
): DecisionCategory {
  const opportunity = scoreOpportunity(asset, assessment, ctx, { maxSafeFinancing: maxCapacity });
  const readiness = scoreFundingReadiness(asset, assessment, ctx);
  return recommendFunding(asset, assessment, ctx, opportunity, readiness).category;
}

export function analyzeCapitalUnlock(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
  sources: DataSource[],
  currentCategory: DecisionCategory,
  portfolioMaxCapacity: number,
): CapitalUnlockOpportunity {
  const plan = unlockSimulationInput(ctx);
  if (!plan) {
    return {
      assetId: asset.id,
      hasUnlock: false,
      currentFinancingCapacity: assessment.financing.maximumSafeFinancing,
      currentCategory,
      primaryBlocker: "No material operational blocker on the current evidence pack.",
      recommendedAction: "Maintain monitoring. No simulated Module 4 change is warranted.",
      potentialFinancingCapacity: assessment.financing.maximumSafeFinancing,
      additionalCapitalUnlockable: 0,
      potentialCategory: currentCategory,
      simulationNote: "Hypothetical Module 4 engines were not rerun because no primary blocker was identified.",
    };
  }

  const simulatedAsset = applySimulationToAsset(asset, plan.input);
  const result = runSimulation(asset, events, conflicts, sources, plan.input);
  const simulatedCtx = simulateContext(ctx, plan.input);
  const potentialCategory = categoryFromSimulated(simulatedAsset, result.simulated, simulatedCtx, Math.max(portfolioMaxCapacity, result.simulated.financing.maximumSafeFinancing));
  const additional = Math.max(0, result.simulated.financing.maximumSafeFinancing - assessment.financing.maximumSafeFinancing);

  return {
    assetId: asset.id,
    hasUnlock: additional > 0 || potentialCategory !== currentCategory,
    currentFinancingCapacity: assessment.financing.maximumSafeFinancing,
    currentCategory,
    primaryBlocker: plan.blocker,
    recommendedAction: plan.action,
    potentialFinancingCapacity: result.simulated.financing.maximumSafeFinancing,
    additionalCapitalUnlockable: additional,
    potentialCategory,
    simulationNote: `SIMULATED only. ${result.explanation} Potential financing ${formatCurrencyINR(result.simulated.financing.maximumSafeFinancing, 2)}.`,
  };
}
