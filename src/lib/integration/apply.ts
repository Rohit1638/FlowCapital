import type { Asset } from "@/types/asset";
import type { IntegrationEvent, TwinPatch } from "@/types/integration";
import { canTransition } from "@/lib/lifecycle";

function num(event: IntegrationEvent, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = event.payload[key];
    if (typeof value === "number") return value;
  }
  return undefined;
}

export function buildTwinPatch(event: IntegrationEvent, asset: Asset): TwinPatch | undefined {
  const lastUpdated = event.timestamp;
  const assetId = asset.id;

  if (event.eventType === "PRODUCTION_PROGRESS_UPDATED") {
    const completion = num(event, ["completionPercentage", "productionPct"]);
    const value = num(event, ["value"]);
    if (completion === undefined) return undefined;
    return {
      assetId,
      productionCompletion: completion,
      currentValue: value,
      lastUpdated,
    };
  }

  if (event.eventType === "PRODUCTION_COMPLETED") {
    return {
      assetId,
      productionCompletion: 100,
      currentValue: num(event, ["value"]),
      lastUpdated,
    };
  }

  if (event.eventType === "FINISHED_GOODS_CONFIRMED" && canTransition(asset.currentStage, "FINISHED_GOODS")) {
    return {
      assetId,
      currentStage: "FINISHED_GOODS",
      productionCompletion: 100,
      verificationStatus: "VERIFIED",
      currentValue: num(event, ["value"]) ?? 5_200_000,
      location: "Chennai finished-goods bay",
      attention: false,
      situation: "Finished goods confirmed from ERP. Twin advanced without a manual edit.",
      lastUpdated,
    };
  }

  if (event.eventType === "QUALITY_VERIFIED" || event.eventType === "QUALITY_CHECK_COMPLETED") {
    return {
      assetId,
      verificationStatus: "VERIFIED",
      lastUpdated,
    };
  }

  if (event.eventType === "SHIPMENT_LOCATION_UPDATED") {
    const location = event.payload.location;
    return {
      assetId,
      location: typeof location === "string" ? location : asset.location,
      lastUpdated,
    };
  }

  return undefined;
}

export function applyTwinPatch(asset: Asset, patch: TwinPatch | undefined): Asset {
  if (!patch || patch.assetId !== asset.id) return asset;
  const next = structuredClone(asset);
  if (patch.productionCompletion !== undefined) {
    next.physical.productionCompletion = patch.productionCompletion;
  }
  if (patch.currentValue !== undefined) {
    next.currentValue = patch.currentValue;
    next.financial.currentValue = patch.currentValue;
  }
  if (patch.currentStage) {
    next.currentStage = patch.currentStage;
    next.physical.stage = patch.currentStage;
  }
  if (patch.verificationStatus) {
    next.physical.verificationStatus = patch.verificationStatus;
  }
  if (patch.location) {
    next.location = patch.location;
    next.physical.location = patch.location;
  }
  if (patch.quantity !== undefined) {
    next.quantity = patch.quantity;
    next.physical.quantity = patch.quantity;
  }
  if (patch.attention !== undefined) next.attention = patch.attention;
  if (patch.situation) next.situation = patch.situation;
  next.lastUpdated = patch.lastUpdated;
  return next;
}
