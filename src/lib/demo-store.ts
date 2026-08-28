"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Asset } from "@/types/asset";
import type { LifecycleEvent } from "@/types/event";
import { baseAssets } from "@/lib/demo-data/assets";
import { baseEvents } from "@/lib/demo-data/events";
import { applyTwinPatch } from "@/lib/integration/apply";
import { useIntegrationState } from "@/lib/integration/store";
import { integrationToLifecycle } from "@/lib/integration/to-lifecycle";
import { useCloudAssetBase } from "@/lib/data/connection";
import {
  DEMO_STORAGE_KEY,
  applyAssetOverlay,
  emptyOverlay,
  nextDemoOverlay,
  type DemoOverlay,
  type DemoStep,
} from "@/lib/demo-simulator";

type OverlayMap = Record<string, DemoOverlay>;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readMap(): OverlayMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as OverlayMap;
  } catch {
    return {};
  }
}

function writeMap(map: OverlayMap) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(map));
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

function getSnapshot(): string {
  if (typeof window === "undefined") return "{}";
  return window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}";
}

const serverSnapshot = "{}";

export function useOverlayMap(): OverlayMap {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  try {
    return JSON.parse(raw) as OverlayMap;
  } catch {
    return {};
  }
}

export function useLiveAssets(): Asset[] {
  const map = useOverlayMap();
  const integration = useIntegrationState();
  const cloudBase = useCloudAssetBase();
  const source = cloudBase ?? baseAssets;
  return useMemo(() => {
    const conflictIds = new Set(
      integration.conflicts
        .filter((item) => item.status === "OPEN" && item.severity === "HIGH")
        .map((item) => item.assetId),
    );
    return source.map((asset) => {
      const patched = applyTwinPatch(applyAssetOverlay(asset, map[asset.id] ?? null), integration.patches[asset.id]);
      if (!conflictIds.has(patched.id) || patched.attention) return patched;
      return { ...patched, attention: true };
    });
  }, [map, integration.patches, integration.conflicts, source]);
}

export function useLiveAsset(assetId: string): Asset | undefined {
  const assets = useLiveAssets();
  return assets.find((asset) => asset.id === assetId);
}

export function useLiveEvents(assetId?: string): LifecycleEvent[] {
  const map = useOverlayMap();
  const integration = useIntegrationState();
  return useMemo(() => {
    const extras = Object.values(map).flatMap((overlay) => overlay.extraEvents);
    const fromEngine = integration.events
      .filter((item) => /^(live-|dup-|production-progression-|warehouse-conflict-|invalid-payment-)/.test(item.id))
      .map(integrationToLifecycle)
      .filter((event): event is LifecycleEvent => event !== null);
    const merged = [...fromEngine, ...extras, ...baseEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return assetId ? merged.filter((event) => event.assetId === assetId) : merged;
  }, [map, assetId, integration.events]);
}

export function useDemoSimulation(assetId: string) {
  const map = useOverlayMap();
  const overlay = map[assetId] ?? emptyOverlay();
  const asset = useLiveAsset(assetId);

  const runStep = useCallback(
    (step: Exclude<DemoStep, 0>) => {
      const base = baseAssets.find((item) => item.id === assetId);
      if (!base) return;
      const current = readMap()[assetId] ?? emptyOverlay();
      const next = nextDemoOverlay(base, current, step);
      writeMap({ ...readMap(), [assetId]: next });
    },
    [assetId],
  );

  const reset = useCallback(() => {
    const next = { ...readMap() };
    delete next[assetId];
    writeMap(next);
  }, [assetId]);

  return { asset, overlay, runStep, reset };
}
