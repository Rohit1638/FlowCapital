import type {
  EventSource,
  EventType,
  IntegrationEvent,
  JsonValue,
  RawEventPayload,
} from "@/types/integration";
import { EVENT_TYPES } from "@/types/integration";
import { SOURCE_CATEGORY, SOURCE_LABELS } from "@/lib/integration/connectors";

function asString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function firstString(raw: RawEventPayload, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asString(raw[key]);
    if (value) return value;
  }
  return undefined;
}

function firstNumber(raw: RawEventPayload, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = asNumber(raw[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function isEventType(value: string | undefined): value is EventType {
  return !!value && (EVENT_TYPES as readonly string[]).includes(value);
}

function buildCanonical(
  source: EventSource,
  raw: RawEventPayload,
  extras: Partial<IntegrationEvent> & { eventType: EventType; timestamp: string },
): IntegrationEvent {
  const now = extras.receivedAt ?? new Date().toISOString();
  const externalEventId =
    firstString(raw, ["externalEventId", "event_id", "id"]) ??
    extras.externalEventId ??
    `${source}-${extras.eventType}-${extras.timestamp}`;

  return {
    id: extras.id ?? `evt-${externalEventId}`,
    externalEventId,
    assetId: extras.assetId ?? firstString(raw, ["assetId", "asset_id", "asset_ref", "batchId"]) ?? null,
    source,
    sourceSystem: SOURCE_LABELS[source],
    eventType: extras.eventType,
    eventCategory: SOURCE_CATEGORY[source],
    timestamp: extras.timestamp,
    receivedAt: now,
    severity: extras.severity ?? "info",
    status: "NORMALIZED",
    confidence: 0,
    confidenceLevel: "MEDIUM",
    payload: extras.payload ?? raw,
    rawPayload: raw,
    processingSteps: extras.processingSteps ?? [],
    explanation: extras.explanation ?? "",
    conflictDetected: false,
    createdAt: extras.createdAt ?? now,
  };
}

export function normalizeERPEvent(raw: RawEventPayload): IntegrationEvent {
  const eventType = isEventType(asString(raw.event_code))
    ? (asString(raw.event_code) as EventType)
    : "PRODUCTION_PROGRESS_UPDATED";
  const timestamp = firstString(raw, ["event_time", "timestamp"]) ?? new Date().toISOString();
  const payload: RawEventPayload = {
    assetRef: firstString(raw, ["asset_ref", "assetId"]) ?? null,
    purchaseOrder: firstString(raw, ["po_no", "purchaseOrderNumber"]) ?? null,
    productionPct: firstNumber(raw, ["production_pct", "completionPercentage"]) ?? null,
    value: firstNumber(raw, ["value", "current_value"]) ?? null,
  };
  return buildCanonical("ERP", raw, { eventType, timestamp, payload });
}

export function normalizeProductionEvent(raw: RawEventPayload): IntegrationEvent {
  const eventType = isEventType(asString(raw.eventType))
    ? (asString(raw.eventType) as EventType)
    : raw.status === "COMPLETED"
      ? "PRODUCTION_COMPLETED"
      : "PRODUCTION_PROGRESS_UPDATED";
  const timestamp = firstString(raw, ["recordedAt", "timestamp"]) ?? new Date().toISOString();
  const payload: RawEventPayload = {
    batchId: firstString(raw, ["batchId", "assetId"]) ?? null,
    completionPercentage: firstNumber(raw, ["completionPercentage", "production_pct"]) ?? null,
    status: firstString(raw, ["status"]) ?? null,
    value: firstNumber(raw, ["value"]) ?? null,
  };
  return buildCanonical("PRODUCTION", raw, { eventType, timestamp, payload });
}

export function normalizeWarehouseEvent(raw: RawEventPayload): IntegrationEvent {
  const expected = firstNumber(raw, ["expected_qty", "expectedQty"]);
  const actual = firstNumber(raw, ["actual_qty", "actualQty"]);
  const mismatch = expected !== undefined && actual !== undefined && expected !== actual;
  const eventType = isEventType(asString(raw.event_code))
    ? (asString(raw.event_code) as EventType)
    : mismatch
      ? "QUANTITY_MISMATCH_DETECTED"
      : "WAREHOUSE_RECEIVED";
  const timestamp = firstString(raw, ["recorded_at", "timestamp"]) ?? new Date().toISOString();
  return buildCanonical("WAREHOUSE", raw, {
    eventType,
    timestamp,
    severity: mismatch ? "critical" : "info",
    payload: {
      assetId: firstString(raw, ["asset_id", "assetId"]) ?? null,
      expectedQty: expected ?? null,
      actualQty: actual ?? null,
      locationCode: firstString(raw, ["location_code", "location"]) ?? null,
    },
  });
}

export function normalizeLogisticsEvent(raw: RawEventPayload): IntegrationEvent {
  const eventType = isEventType(asString(raw.eventType))
    ? (asString(raw.eventType) as EventType)
    : "SHIPMENT_LOCATION_UPDATED";
  const timestamp = firstString(raw, ["timestamp", "event_time"]) ?? new Date().toISOString();
  return buildCanonical("LOGISTICS", raw, {
    eventType,
    timestamp,
    payload: {
      shipmentId: firstString(raw, ["shipmentId", "shipment_id"]) ?? null,
      location: firstString(raw, ["location"]) ?? null,
      delayHours: firstNumber(raw, ["delayHours"]) ?? null,
    },
  });
}

export function normalizeFinanceEvent(raw: RawEventPayload): IntegrationEvent {
  const eventType = isEventType(asString(raw.event_code) ?? asString(raw.eventType))
    ? ((asString(raw.event_code) ?? asString(raw.eventType)) as EventType)
    : "INVOICE_GENERATED";
  const timestamp = firstString(raw, ["posted_at", "timestamp"]) ?? new Date().toISOString();
  return buildCanonical("FINANCE", raw, {
    eventType,
    timestamp,
    payload: {
      invoiceNumber: firstString(raw, ["invoice_no", "invoiceNumber"]) ?? null,
      amount: firstNumber(raw, ["amount", "invoice_value"]) ?? null,
      assetRef: firstString(raw, ["asset_ref", "assetId"]) ?? null,
    },
  });
}

export function normalizeVerificationEvent(raw: RawEventPayload): IntegrationEvent {
  const eventType = isEventType(asString(raw.eventType))
    ? (asString(raw.eventType) as EventType)
    : "QUALITY_VERIFIED";
  const timestamp = firstString(raw, ["verifiedAt", "timestamp"]) ?? new Date().toISOString();
  return buildCanonical("VERIFICATION", raw, {
    eventType,
    timestamp,
    payload: {
      subject: firstString(raw, ["subject", "note"]) ?? null,
      result: firstString(raw, ["result"]) ?? "PASS",
    },
  });
}

export function normalizeRawEvent(source: EventSource, raw: RawEventPayload): IntegrationEvent {
  switch (source) {
    case "ERP":
      return normalizeERPEvent(raw);
    case "PRODUCTION":
      return normalizeProductionEvent(raw);
    case "WAREHOUSE":
      return normalizeWarehouseEvent(raw);
    case "LOGISTICS":
      return normalizeLogisticsEvent(raw);
    case "FINANCE":
      return normalizeFinanceEvent(raw);
    case "VERIFICATION":
      return normalizeVerificationEvent(raw);
  }
}
