import type { Asset } from "@/types/asset";
import type { FinancingOpportunityScore } from "@/types/decisions";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { buildOpportunityFactors, type OpportunityPortfolioRef } from "@/lib/decisions/opportunity-factors";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreOpportunity(
  asset: Asset,
  assessment: FinancialAssessment,
  ctx: IntelligenceContext,
  portfolio: OpportunityPortfolioRef,
): FinancingOpportunityScore {
  const factors = buildOpportunityFactors(asset, assessment, ctx, portfolio);
  const score = clampScore(factors.reduce((sum, factor) => sum + factor.points, 0));
  const lead = [...factors].sort((a, b) => b.points - a.points)[0];
  return {
    assetId: asset.id,
    score,
    factors,
    summary: `Financing opportunity ${score}/100. Strongest contribution: ${lead?.label ?? "capacity"}.`,
  };
}
