import type { LifecycleStage } from "@/types/asset";
import type { EventCategory, EventDomain, LifecycleEvent } from "@/types/event";
import type { EventType, IntegrationEvent, IntegrationEventCategory } from "@/types/integration";

const CATEGORY_MAP: Record<IntegrationEventCategory, EventCategory> = {
  procurement: "procurement",
  production: "production",
  warehouse: "warehouse",
  logistics: "shipment",
  finance: "invoice",
  verification: "verification",
};

const DOMAIN_MAP: Record<IntegrationEventCategory, EventDomain> = {
  procurement: "physical",
  production: "physical",
  warehouse: "physical",
  logistics: "physical",
  finance: "financial",
  verification: "verification",
};

const STAGE_HINT: Partial<Record<EventType, LifecycleStage>> = {
  PURCHASE_ORDER_CREATED: "PURCHASE_ORDER",
  PURCHASE_ORDER_VERIFIED: "PURCHASE_ORDER",
  PROCUREMENT_STARTED: "PROCUREMENT",
  PROCUREMENT_COMPLETED: "PROCUREMENT",
  PRODUCTION_STARTED: "PRODUCTION",
  PRODUCTION_PROGRESS_UPDATED: "PRODUCTION",
  PRODUCTION_COMPLETED: "PRODUCTION",
  QUALITY_CHECK_COMPLETED: "PRODUCTION",
  QUALITY_VERIFIED: "PRODUCTION",
  FINISHED_GOODS_CONFIRMED: "FINISHED_GOODS",
  WAREHOUSE_RECEIVED: "WAREHOUSE",
  QUANTITY_VERIFIED: "WAREHOUSE",
  QUANTITY_MISMATCH_DETECTED: "WAREHOUSE",
  INVENTORY_STATUS_UPDATED: "WAREHOUSE",
  SHIPMENT_CREATED: "IN_TRANSIT",
  SHIPMENT_LOCATION_UPDATED: "IN_TRANSIT",
  SHIPMENT_DELAY_DETECTED: "IN_TRANSIT",
  DELIVERY_CONFIRMED: "DELIVERED",
  INVOICE_GENERATED: "INVOICE",
  INVOICE_VERIFIED: "INVOICE",
  PAYMENT_RECEIVED: "RECEIVABLE",
  PAYMENT_DELAY_DETECTED: "RECEIVABLE",
  ASSET_VERIFIED: "PRODUCTION",
  DOCUMENT_VERIFIED: "PURCHASE_ORDER",
  LOCATION_VERIFIED: "IN_TRANSIT",
};

export function integrationToLifecycle(event: IntegrationEvent): LifecycleEvent | null {
  if (!event.assetId) return null;
  return {
    id: `int-${event.id}`,
    assetId: event.assetId,
    type: event.eventType,
    stage: STAGE_HINT[event.eventType] ?? "PRODUCTION",
    title: event.eventType.replaceAll("_", " "),
    description: event.explanation,
    timestamp: event.timestamp,
    relativeTime: "",
    severity:
      event.status === "CONFLICT_DETECTED" || event.status === "REJECTED"
        ? "critical"
        : event.severity,
    category: CATEGORY_MAP[event.eventCategory],
    domain:
      event.status === "CONFLICT_DETECTED" || event.status === "REJECTED"
        ? "risk"
        : DOMAIN_MAP[event.eventCategory],
    source: event.sourceSystem,
    metadata: {
      status: event.status,
      confidence: event.confidence,
    },
  };
}
