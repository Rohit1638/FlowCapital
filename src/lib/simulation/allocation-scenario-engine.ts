import type { Asset } from "@/types/asset";
import type { AllocationWhatIfResult, AssetDecisionRecord, CapitalAllocationInput } from "@/types/decisions";
import type { ConflictRecord, IntegrationEvent } from "@/types/integration";
import type { FinancialAssessment, IntelligenceContext } from "@/types/intelligence";
import { formatCurrencyINR } from "@/lib/format";
import { unlockSimulationInput } from "@/lib/decisions/capital-unlock-engine";
import { allocateCapital } from "@/lib/decisions/capital-allocation-engine";
import { evaluatePortfolio } from "@/lib/decisions/portfolio-decision-engine";
import { applySimulationToAsset, assessAsset, simulateContext } from "@/lib/intelligence/assess";
import { getSourcesForAsset } from "@/lib/demo-data/sources";
import { PORTFOLIO_UNLOCK_SCENARIO } from "@/lib/demo-data/unlock-scenarios";

export function buildImprovedPortfolioState(
  assets: Asset[],
  assessments: FinancialAssessment[],
  contexts: IntelligenceContext[],
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
): {
  assets: Asset[];
  assessments: FinancialAssessment[];
  contexts: IntelligenceContext[];
  unlockHighlights: AllocationWhatIfResult["unlockHighlights"];
} {
  const assessmentById = new Map(assessments.map((item) => [item.assetId, item]));
  const unlockHighlights: AllocationWhatIfResult["unlockHighlights"] = [];
  const nextAssets: Asset[] = [];
  const nextAssessments: FinancialAssessment[] = [];
  const nextContexts: IntelligenceContext[] = [];

  assets.forEach((asset, index) => {
    const ctx = contexts[index];
    const current = assessmentById.get(asset.id);
    const plan = unlockSimulationInput(ctx);
    if (!plan || !current) {
      nextAssets.push(asset);
      if (current) nextAssessments.push(current);
      nextContexts.push(ctx);
      return;
    }
    const simulatedAsset = applySimulationToAsset(asset, plan.input);
    const simulatedCtx = simulateContext(ctx, plan.input);
    const simulated = assessAsset(simulatedAsset, events, conflicts, getSourcesForAsset(asset.id), {
      simulated: true,
      context: simulatedCtx,
    });
    nextAssets.push(simulatedAsset);
    nextAssessments.push(simulated);
    nextContexts.push(simulatedCtx);
    unlockHighlights.push({
      assetId: asset.id,
      additionalCapital: Math.max(0, simulated.financing.maximumSafeFinancing - current.financing.maximumSafeFinancing),
      from: "HOLD_FOR_REVIEW",
      to: "CONDITIONAL_FUNDING",
    });
  });

  return { assets: nextAssets, assessments: nextAssessments, contexts: nextContexts, unlockHighlights };
}

export function compareAllocationWhatIf(
  assets: Asset[],
  assessments: FinancialAssessment[],
  contexts: IntelligenceContext[],
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
  currentDecisions: AssetDecisionRecord[],
  input: CapitalAllocationInput,
): AllocationWhatIfResult {
  const current = allocateCapital(currentDecisions, input);
  const improvedState = buildImprovedPortfolioState(assets, assessments, contexts, events, conflicts);
  const improvedPortfolio = evaluatePortfolio(
    improvedState.assets,
    improvedState.assessments,
    improvedState.contexts,
    events,
    conflicts,
  );
  const improved = allocateCapital(improvedPortfolio.records, input);
  const additionalDeployable = Math.max(0, improved.allocatedCapital - current.allocatedCapital);

  const highlights = improvedState.unlockHighlights
    .map((item) => {
      const from = currentDecisions.find((row) => row.assetId === item.assetId);
      const to = improvedPortfolio.records.find((row) => row.assetId === item.assetId);
      return {
        assetId: item.assetId,
        additionalCapital: item.additionalCapital,
        from: from?.recommendation.category ?? item.from,
        to: to?.recommendation.category ?? item.to,
      };
    })
    .filter((item) => item.additionalCapital > 0 || item.from !== item.to)
    .sort((a, b) => b.additionalCapital - a.additionalCapital);

  const top = highlights[0];
  const highlight = top
    ? `Resolving ${top.assetId} issues could increase the portfolio's safe deployable capital by ${formatCurrencyINR(top.additionalCapital, 2)} under ${input.strategy.replaceAll("_", " ")}. ${PORTFOLIO_UNLOCK_SCENARIO.summary}`
    : `No simulated operational fix currently increases deployable capital under ${input.strategy.replaceAll("_", " ")}.`;

  return {
    current,
    improved,
    additionalDeployable,
    highlight,
    unlockHighlights: highlights,
  };
}
