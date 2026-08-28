import type { Asset } from "@/types/asset";
import type { LifecycleEvent } from "@/types/event";
import { assertTransition } from "@/lib/lifecycle";
import { PRIMARY_ASSET_ID } from "@/lib/demo-data/assets";

export type DemoStep = 0 | 1 | 2 | 3;

export interface DemoOverlay {
  step: DemoStep;
  extraEvents: LifecycleEvent[];
}

export const DEMO_STORAGE_KEY = "flowcapital.demo.overlay.v1";

export function emptyOverlay(): DemoOverlay {
  return { step: 0, extraEvents: [] };
}

function stamp(): string {
  return new Date().toISOString();
}

export function applyAssetOverlay(asset: Asset, overlay: DemoOverlay | null): Asset {
  if (!overlay || overlay.step === 0 || asset.id !== PRIMARY_ASSET_ID) {
    return asset;
  }

  const next = structuredClone(asset);
  const updatedAt = overlay.extraEvents[0]?.timestamp ?? stamp();

  if (overlay.step >= 1) {
    next.physical.productionCompletion = 80;
    next.currentValue = 4_780_000;
    next.financial.currentValue = 4_780_000;
    next.lastUpdated = updatedAt;
  }

  if (overlay.step >= 2) {
    next.physical.productionCompletion = 100;
    next.currentValue = 5_200_000;
    next.financial.currentValue = 5_200_000;
    next.lastUpdated = updatedAt;
  }

  if (overlay.step >= 3) {
    assertTransition("PRODUCTION", "FINISHED_GOODS");
    next.currentStage = "FINISHED_GOODS";
    next.physical.stage = "FINISHED_GOODS";
    next.physical.productionCompletion = 100;
    next.physical.verificationStatus = "VERIFIED";
    next.physical.condition = "GOOD";
    next.physical.location = "Chennai finished-goods bay";
    next.currentValue = 5_200_000;
    next.financial.currentValue = 5_200_000;
    next.situation = "Production is complete. Batch A-452 is verified finished goods.";
    next.attention = false;
    next.lastUpdated = updatedAt;
  }

  return next;
}

export function nextDemoOverlay(asset: Asset, current: DemoOverlay, action: Exclude<DemoStep, 0>): DemoOverlay {
  if (asset.id !== PRIMARY_ASSET_ID) {
    return current;
  }
  if (action !== current.step + 1) {
    return current;
  }

  const timestamp = stamp();
  const extraEvents = [...current.extraEvents];

  if (action === 1) {
    extraEvents.unshift({
      id: `sim-80-${timestamp}`,
      assetId: PRIMARY_ASSET_ID,
      type: "PRODUCTION_80",
      stage: "PRODUCTION",
      title: "Production reached 80% completion",
      description: "Demo simulation: Line 3 cleared 14,800 units. Twin value marked to ₹47.80L.",
      timestamp,
      relativeTime: "Just now",
      severity: "success",
      category: "production",
      domain: "physical",
      source: "Demo Simulation",
      metadata: { completion: 80, simulated: true },
    });
  }

  if (action === 2) {
    extraEvents.unshift({
      id: `sim-100-${timestamp}`,
      assetId: PRIMARY_ASSET_ID,
      type: "PRODUCTION_COMPLETE",
      stage: "PRODUCTION",
      title: "Production completed",
      description: "Demo simulation: Batch A-452 reached 100% production completion. Value ₹52.00L.",
      timestamp,
      relativeTime: "Just now",
      severity: "success",
      category: "production",
      domain: "physical",
      source: "Demo Simulation",
      metadata: { completion: 100, simulated: true },
    });
  }

  if (action === 3) {
    assertTransition("PRODUCTION", "FINISHED_GOODS");
    extraEvents.unshift({
      id: `sim-fg-${timestamp}`,
      assetId: PRIMARY_ASSET_ID,
      type: "MOVED_FINISHED_GOODS",
      stage: "FINISHED_GOODS",
      title: "Moved to finished goods",
      description: "Demo simulation: Finished-goods verification VERIFIED. Lifecycle advanced PRODUCTION → FINISHED_GOODS.",
      timestamp,
      relativeTime: "Just now",
      severity: "success",
      category: "verification",
      domain: "verification",
      source: "Demo Simulation",
      metadata: { simulated: true },
    });
  }

  return { step: action, extraEvents };
}
