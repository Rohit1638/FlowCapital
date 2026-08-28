"use client";

import { useMemo } from "react";
import type { Asset } from "@/types/asset";
import { getSourcesForAsset } from "@/lib/demo-data/sources";
import { useLiveAssets } from "@/lib/demo-store";
import { useConflicts, useIntegrationEvents } from "@/lib/integration/store";
import { assessAsset } from "@/lib/intelligence/assess";
import { historicalSnapshots } from "@/lib/intelligence/risk-trend";
import { runSimulation } from "@/lib/simulation/financial-simulator";
import type { SimulationInput } from "@/types/intelligence";

export function useFinancialAssessment(assetId: string) {
  const assets = useLiveAssets();
  const events = useIntegrationEvents();
  const conflicts = useConflicts();
  const asset = assets.find((item) => item.id === assetId);
  return useMemo(() => {
    if (!asset) return null;
    return assessAsset(asset, events, conflicts, getSourcesForAsset(asset.id));
  }, [asset, events, conflicts]);
}

export function usePortfolioIntelligence() {
  const assets = useLiveAssets();
  const events = useIntegrationEvents();
  const conflicts = useConflicts();
  return useMemo(
    () => assets.map((asset) => assessAsset(asset, events, conflicts, getSourcesForAsset(asset.id))),
    [assets, events, conflicts],
  );
}

export function useLiveAssetList(): Asset[] {
  return useLiveAssets();
}

export function useSimulation(assetId: string, input: SimulationInput | null) {
  const assets = useLiveAssets();
  const events = useIntegrationEvents();
  const conflicts = useConflicts();
  const asset = assets.find((item) => item.id === assetId);
  return useMemo(() => {
    if (!asset || !input) return null;
    return runSimulation(asset, events, conflicts, getSourcesForAsset(asset.id), input);
  }, [asset, events, conflicts, input]);
}

export function useRiskPath(assetId: string) {
  const assets = useLiveAssets();
  const assessment = useFinancialAssessment(assetId);
  const asset = assets.find((item) => item.id === assetId);
  return useMemo(() => {
    if (!asset || !assessment) return [];
    return historicalSnapshots(asset, assessment.risk.overallScore);
  }, [asset, assessment]);
}
