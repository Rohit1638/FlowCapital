"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getSourcesForAsset } from "@/lib/demo-data/sources";
import { useLiveAssets } from "@/lib/demo-store";
import { useConflicts, useIntegrationEvents } from "@/lib/integration/store";
import { usePortfolioIntelligence } from "@/lib/intelligence/hooks";
import { buildIntelligenceContext } from "@/lib/intelligence/context";
import { evaluatePortfolio } from "@/lib/decisions/portfolio-decision-engine";
import { compareAllocationStrategies, simulateAllocation } from "@/lib/simulation/capital-allocation-simulator";
import { compareAllocationWhatIf } from "@/lib/simulation/allocation-scenario-engine";
import {
  DEFAULT_DECISION_PREFS,
  DECISIONS_STORAGE_KEY,
  readDecisionPrefs,
  writeDecisionPrefs,
  type DecisionPrefs,
} from "@/lib/decisions/prefs";
import type { AllocationStrategy, CapitalAllocationInput } from "@/types/decisions";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function snapshot(): string {
  if (typeof window === "undefined") return "__server__";
  return window.localStorage.getItem(DECISIONS_STORAGE_KEY) ?? "__empty__";
}

export function useDecisionPrefs(): [DecisionPrefs, (patch: Partial<DecisionPrefs>) => void] {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "__server__");
  const prefs = useMemo(
    () => (raw === "__server__" ? DEFAULT_DECISION_PREFS : readDecisionPrefs()),
    [raw],
  );

  const setPrefs = useCallback((patch: Partial<DecisionPrefs>) => {
    const next = { ...readDecisionPrefs(), ...patch };
    writeDecisionPrefs(next);
    emit();
  }, []);

  return [prefs, setPrefs];
}

export function usePortfolioDecisions() {
  const assets = useLiveAssets();
  const events = useIntegrationEvents();
  const conflicts = useConflicts();
  const assessments = usePortfolioIntelligence();

  return useMemo(() => {
    const contexts = assets.map((asset) => buildIntelligenceContext(asset, events, conflicts, getSourcesForAsset(asset.id)));
    return evaluatePortfolio(assets, assessments, contexts, events, conflicts);
  }, [assets, events, conflicts, assessments]);
}

export function useAssetDecision(assetId: string) {
  const { records, summary } = usePortfolioDecisions();
  return {
    record: records.find((item) => item.assetId === assetId) ?? null,
    records,
    summary,
  };
}

export function useCapitalAllocation(input?: Partial<CapitalAllocationInput>) {
  const { records } = usePortfolioDecisions();
  const [prefs] = useDecisionPrefs();
  const resolved: CapitalAllocationInput = {
    availableCapital: input?.availableCapital ?? prefs.availableCapital,
    strategy: input?.strategy ?? prefs.strategy,
    includeConditional: input?.includeConditional ?? true,
  };
  return useMemo(() => simulateAllocation(records, resolved), [records, resolved.availableCapital, resolved.strategy, resolved.includeConditional]);
}

export function useAllocationComparison(availableCapital: number) {
  const { records } = usePortfolioDecisions();
  return useMemo(() => compareAllocationStrategies(records, availableCapital), [records, availableCapital]);
}

export function useAllocationWhatIf(availableCapital: number, strategy: AllocationStrategy) {
  const assets = useLiveAssets();
  const events = useIntegrationEvents();
  const conflicts = useConflicts();
  const assessments = usePortfolioIntelligence();
  const { records } = usePortfolioDecisions();

  return useMemo(() => {
    const contexts = assets.map((asset) => buildIntelligenceContext(asset, events, conflicts, getSourcesForAsset(asset.id)));
    return compareAllocationWhatIf(assets, assessments, contexts, events, conflicts, records, {
      availableCapital,
      strategy,
    });
  }, [assets, assessments, events, conflicts, records, availableCapital, strategy]);
}
