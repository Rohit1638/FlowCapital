"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Asset } from "@/types/asset";
import type { ConflictRecord, ConflictStatus, IntegrationEvent, TwinPatch } from "@/types/integration";
import { seedConflicts, seedIntegrationEvents } from "@/lib/demo-data/integration-events";
import { applyTwinPatch } from "@/lib/integration/apply";
import { processIncomingEvent } from "@/lib/integration/process";
import { DEMO_SCENARIOS, type DemoScenario } from "@/lib/integration/scenarios";
import { DEMO_STORAGE_KEY } from "@/lib/demo-simulator";
import { DECISIONS_STORAGE_KEY } from "@/lib/decisions/prefs";
import { baseAssets } from "@/lib/demo-data/assets";
import { applyAssetOverlay, type DemoOverlay } from "@/lib/demo-simulator";

export const INTEGRATION_STORAGE_KEY = "flowcapital.integration.v1";

export interface IntegrationState {
  events: IntegrationEvent[];
  conflicts: ConflictRecord[];
  patches: Record<string, TwinPatch>;
  scenarioId: DemoScenario["id"] | null;
  scenarioCursor: number;
  playing: boolean;
}

function defaults(): IntegrationState {
  return {
    events: seedIntegrationEvents,
    conflicts: seedConflicts,
    patches: {},
    scenarioId: "production-progression",
    scenarioCursor: 0,
    playing: false,
  };
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readState(): IntegrationState {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(INTEGRATION_STORAGE_KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...(JSON.parse(raw) as IntegrationState) };
  } catch {
    return defaults();
  }
}

function writeState(state: IntegrationState) {
  window.localStorage.setItem(INTEGRATION_STORAGE_KEY, JSON.stringify(state));
  emit();
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
  return window.localStorage.getItem(INTEGRATION_STORAGE_KEY) ?? "__empty__";
}

function currentAssets(state: IntegrationState): Asset[] {
  let overlay: Record<string, DemoOverlay> = {};
  if (typeof window !== "undefined") {
    try {
      overlay = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}") as Record<string, DemoOverlay>;
    } catch {
      overlay = {};
    }
  }
  return baseAssets.map((asset) => {
    const withM2 = applyAssetOverlay(asset, overlay[asset.id] ?? null);
    return applyTwinPatch(withM2, state.patches[asset.id]);
  });
}

export function useIntegrationState(): IntegrationState {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "__server__");
  return useMemo(() => {
    if (raw === "__server__") return defaults();
    return readState();
  }, [raw]);
}

export function useIntegrationAssets(baseLive: Asset[]): Asset[] {
  const state = useIntegrationState();
  return useMemo(
    () => baseLive.map((asset) => applyTwinPatch(asset, state.patches[asset.id])),
    [baseLive, state.patches],
  );
}

export function useIntegrationEvents(): IntegrationEvent[] {
  const state = useIntegrationState();
  return useMemo(
    () => [...state.events].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()),
    [state.events],
  );
}

export function useConflicts(): ConflictRecord[] {
  return useIntegrationState().conflicts;
}

export function ingestRawEvent(
  source: IntegrationEvent["source"],
  raw: IntegrationEvent["rawPayload"],
  id?: string,
) {
  const state = readState();
  const assets = currentAssets(state);
  const stamped = {
    ...raw,
    recordedAt: typeof raw.recordedAt === "string" ? raw.recordedAt : new Date().toISOString(),
    event_time: typeof raw.event_time === "string" ? raw.event_time : new Date().toISOString(),
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : new Date().toISOString(),
    posted_at: typeof raw.posted_at === "string" ? raw.posted_at : new Date().toISOString(),
    verifiedAt: typeof raw.verifiedAt === "string" ? raw.verifiedAt : new Date().toISOString(),
    recorded_at: typeof raw.recorded_at === "string" ? raw.recorded_at : new Date().toISOString(),
  };
  const result = processIncomingEvent(source, stamped, assets, state.events, {
    id: id ?? `live-${Date.now()}`,
  });
  const events = [result.event, ...state.events.filter((item) => item.id !== result.event.id)];
  const conflicts = result.conflict
    ? [result.conflict, ...state.conflicts.filter((item) => item.id !== result.conflict?.id)]
    : state.conflicts;
  const patches = { ...state.patches };
  if (result.patch) patches[result.patch.assetId] = { ...patches[result.patch.assetId], ...result.patch };
  writeState({ ...state, events, conflicts, patches });
  return result;
}

export function playScenarioStep() {
  const state = readState();
  if (!state.scenarioId) return;
  const scenario = DEMO_SCENARIOS.find((item) => item.id === state.scenarioId);
  if (!scenario) return;
  const step = scenario.steps[state.scenarioCursor];
  if (!step) {
    writeState({ ...state, playing: false });
    return;
  }
  const now = new Date().toISOString();
  ingestRawEvent(
    step.source,
    {
      ...step.raw,
      recordedAt: now,
      event_time: now,
      timestamp: now,
      posted_at: now,
      verifiedAt: now,
      recorded_at: now,
    },
    `${scenario.id}-${step.id}-${Date.now()}`,
  );
  const latest = readState();
  writeState({
    ...latest,
    scenarioId: state.scenarioId,
    scenarioCursor: state.scenarioCursor + 1,
    playing: latest.playing,
  });
}

export function selectScenario(id: DemoScenario["id"] | null) {
  writeState({ ...readState(), scenarioId: id, scenarioCursor: 0, playing: false });
}

export function setPlaying(playing: boolean) {
  writeState({ ...readState(), playing });
}

export function startSimulation(id?: DemoScenario["id"]) {
  const state = readState();
  const scenarioId = id ?? state.scenarioId ?? "production-progression";
  const scenario = DEMO_SCENARIOS.find((item) => item.id === scenarioId);
  const cursor =
    state.scenarioId === scenarioId && scenario && state.scenarioCursor < scenario.steps.length
      ? state.scenarioCursor
      : 0;
  writeState({ ...state, scenarioId, scenarioCursor: cursor, playing: true });
}

export function resetScenario() {
  const state = readState();
  writeState({ ...state, scenarioCursor: 0, playing: false });
}

export function resetIntegration() {
  writeState(defaults());
}

export function resetAllDemoData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
  window.localStorage.removeItem(INTEGRATION_STORAGE_KEY);
  window.localStorage.removeItem(DECISIONS_STORAGE_KEY);
  emit();
  window.dispatchEvent(new Event("storage"));
}

export function updateConflictStatus(id: string, status: ConflictStatus) {
  const state = readState();
  writeState({
    ...state,
    conflicts: state.conflicts.map((item) => (item.id === id ? { ...item, status } : item)),
  });
}

export function useEventMetrics() {
  const events = useIntegrationEvents();
  return {
    received: events.length,
    applied: events.filter((item) => item.status === "APPLIED").length,
    conflicts: events.filter((item) => item.status === "CONFLICT_DETECTED").length,
    rejected: events.filter((item) => item.status === "REJECTED" || item.status === "DUPLICATE").length,
  };
}

export function duplicateLastApplied(assetId: string) {
  const state = readState();
  const last = state.events.find((item) => item.assetId === assetId && item.status === "APPLIED");
  if (!last) return;
  ingestRawEvent(last.source, last.rawPayload, `dup-${last.id}-${Date.now()}`);
}
