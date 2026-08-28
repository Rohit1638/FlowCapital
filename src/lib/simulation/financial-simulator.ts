import type { Asset, DataSource } from "@/types/asset";
import type { ConflictRecord, IntegrationEvent } from "@/types/integration";
import type { SimulationInput, SimulationResult } from "@/types/intelligence";
import { applySimulationToAsset, assessAsset, simulateContext } from "@/lib/intelligence/assess";
import { buildIntelligenceContext } from "@/lib/intelligence/context";
import { financialImpact } from "@/lib/intelligence/financial-impact";
import { explainFinancing } from "@/lib/intelligence/explainability";

export function runSimulation(
  asset: Asset,
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
  sources: DataSource[],
  input: SimulationInput,
): SimulationResult {
  const current = assessAsset(asset, events, conflicts, sources);
  const simulatedAsset = applySimulationToAsset(asset, input);
  const ctx = simulateContext(buildIntelligenceContext(asset, events, conflicts, sources), input);
  const simulated = assessAsset(simulatedAsset, events, conflicts, sources, { simulated: true, context: ctx });
  const impact = financialImpact(current, simulated);
  const explanation = `${impact.summary} ${explainFinancing(simulated)} Results are SIMULATED and do not change the Digital Asset Twin.`;
  return { current, simulated, impact, explanation };
}
