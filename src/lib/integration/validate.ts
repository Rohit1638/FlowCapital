import type { Asset, LifecycleStage } from "@/types/asset";
import type { EventType, IntegrationEvent, ValidationResult } from "@/types/integration";
import { EVENT_SOURCES, EVENT_TYPES } from "@/types/integration";
import { getStageIndex } from "@/lib/lifecycle";

const STAGE_ALLOWLIST: Partial<Record<EventType, LifecycleStage[]>> = {
  PURCHASE_ORDER_CREATED: ["PURCHASE_ORDER"],
  PURCHASE_ORDER_VERIFIED: ["PURCHASE_ORDER"],
  PROCUREMENT_STARTED: ["PURCHASE_ORDER", "PROCUREMENT"],
  PROCUREMENT_COMPLETED: ["PROCUREMENT"],
  PRODUCTION_STARTED: ["RAW_MATERIAL", "PRODUCTION"],
  PRODUCTION_PROGRESS_UPDATED: ["PRODUCTION"],
  PRODUCTION_COMPLETED: ["PRODUCTION"],
  QUALITY_CHECK_COMPLETED: ["PRODUCTION", "FINISHED_GOODS", "RAW_MATERIAL", "WAREHOUSE"],
  QUALITY_VERIFIED: ["PRODUCTION", "FINISHED_GOODS", "RAW_MATERIAL", "WAREHOUSE"],
  FINISHED_GOODS_CONFIRMED: ["PRODUCTION"],
  WAREHOUSE_RECEIVED: ["FINISHED_GOODS", "IN_TRANSIT", "WAREHOUSE"],
  QUANTITY_VERIFIED: ["WAREHOUSE", "FINISHED_GOODS"],
  QUANTITY_MISMATCH_DETECTED: ["WAREHOUSE", "FINISHED_GOODS", "PRODUCTION"],
  INVENTORY_STATUS_UPDATED: ["WAREHOUSE"],
  SHIPMENT_CREATED: ["FINISHED_GOODS", "IN_TRANSIT"],
  SHIPMENT_LOCATION_UPDATED: ["IN_TRANSIT"],
  SHIPMENT_DELAY_DETECTED: ["IN_TRANSIT"],
  DELIVERY_CONFIRMED: ["IN_TRANSIT", "WAREHOUSE", "DELIVERED"],
  INVOICE_GENERATED: ["DELIVERED", "INVOICE", "RECEIVABLE"],
  INVOICE_VERIFIED: ["INVOICE", "RECEIVABLE"],
  PAYMENT_RECEIVED: ["INVOICE", "RECEIVABLE"],
  PAYMENT_DELAY_DETECTED: ["RECEIVABLE"],
  ASSET_VERIFIED: ["PURCHASE_ORDER", "PROCUREMENT", "RAW_MATERIAL", "PRODUCTION", "FINISHED_GOODS", "IN_TRANSIT", "WAREHOUSE"],
  DOCUMENT_VERIFIED: ["PURCHASE_ORDER", "PROCUREMENT", "INVOICE", "RECEIVABLE"],
  LOCATION_VERIFIED: ["IN_TRANSIT", "WAREHOUSE", "DELIVERED"],
};

export function eventFingerprint(event: Pick<IntegrationEvent, "externalEventId" | "assetId" | "eventType" | "timestamp" | "source">): string {
  return `${event.source}|${event.assetId ?? "none"}|${event.eventType}|${event.timestamp}|${event.externalEventId}`;
}

export function validateEvent(
  event: IntegrationEvent,
  asset: Asset | undefined,
  existing: IntegrationEvent[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event.eventType || !(EVENT_TYPES as readonly string[]).includes(event.eventType)) {
    errors.push("Event type is not recognised.");
  }
  if (!event.source || !(EVENT_SOURCES as readonly string[]).includes(event.source)) {
    errors.push("Event source is not recognised.");
  }
  if (!event.timestamp) {
    errors.push("Timestamp is required.");
  }
  if (!asset) {
    errors.push("Asset does not exist or could not be matched.");
  }

  const duplicate = existing.some(
    (item) =>
      item.id !== event.id &&
      (item.externalEventId === event.externalEventId || eventFingerprint(item) === eventFingerprint(event)) &&
      (item.status === "APPLIED" || item.status === "CONFLICT_DETECTED" || item.status === "DUPLICATE"),
  );
  if (duplicate) {
    errors.push("DUPLICATE EVENT PREVENTED");
  }

  if (asset) {
    const allowed = STAGE_ALLOWLIST[event.eventType];
    if (allowed && !allowed.includes(asset.currentStage)) {
      const minAllowed = Math.min(...allowed.map((stage) => getStageIndex(stage)));
      if (getStageIndex(asset.currentStage) < minAllowed) {
        if (event.eventType === "PAYMENT_RECEIVED") {
          errors.push(
            "Payment cannot be received before the asset progresses through delivery, invoicing, and receivable stages.",
          );
        } else if (event.eventType === "PRODUCTION_COMPLETED") {
          errors.push(
            "A PRODUCTION_COMPLETED event cannot be accepted while the twin is still at purchase-order or procurement.",
          );
        } else {
          errors.push(`${event.eventType} is not appropriate for lifecycle stage ${asset.currentStage}.`);
        }
      } else {
        warnings.push("Historical signal recorded after the twin had already moved past this stage.");
      }
    }
  }

  const completion = event.payload.completionPercentage ?? event.payload.productionPct;
  if (typeof completion === "number" && (completion < 0 || completion > 100)) {
    errors.push("Production percentage must be between 0 and 100.");
  }
  if (typeof event.confidence === "number" && (event.confidence < 0 || event.confidence > 100)) {
    errors.push("Confidence must be between 0 and 100.");
  }

  return { valid: errors.length === 0, errors, warnings };
}
