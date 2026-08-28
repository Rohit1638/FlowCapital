import type { EventSeverity } from "./event";
import type { LifecycleStage, VerificationStatus } from "./asset";

export const EVENT_SOURCES = [
  "ERP",
  "PRODUCTION",
  "WAREHOUSE",
  "LOGISTICS",
  "FINANCE",
  "VERIFICATION",
] as const;

export type EventSource = (typeof EVENT_SOURCES)[number];

export const EVENT_TYPES = [
  "PURCHASE_ORDER_CREATED",
  "PURCHASE_ORDER_VERIFIED",
  "PROCUREMENT_STARTED",
  "PROCUREMENT_COMPLETED",
  "PRODUCTION_STARTED",
  "PRODUCTION_PROGRESS_UPDATED",
  "PRODUCTION_COMPLETED",
  "QUALITY_CHECK_COMPLETED",
  "QUALITY_VERIFIED",
  "FINISHED_GOODS_CONFIRMED",
  "WAREHOUSE_RECEIVED",
  "QUANTITY_VERIFIED",
  "QUANTITY_MISMATCH_DETECTED",
  "INVENTORY_STATUS_UPDATED",
  "SHIPMENT_CREATED",
  "SHIPMENT_LOCATION_UPDATED",
  "SHIPMENT_DELAY_DETECTED",
  "DELIVERY_CONFIRMED",
  "INVOICE_GENERATED",
  "INVOICE_VERIFIED",
  "PAYMENT_RECEIVED",
  "PAYMENT_DELAY_DETECTED",
  "ASSET_VERIFIED",
  "DOCUMENT_VERIFIED",
  "LOCATION_VERIFIED",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type IntegrationEventCategory =
  | "procurement"
  | "production"
  | "warehouse"
  | "logistics"
  | "finance"
  | "verification";

export type EventProcessingStatus =
  | "RECEIVED"
  | "NORMALIZED"
  | "VALIDATED"
  | "RECONCILING"
  | "CONFLICT_DETECTED"
  | "APPLIED"
  | "REJECTED"
  | "FAILED"
  | "DUPLICATE";

export type ProcessingStepKey =
  | "RECEIVED"
  | "NORMALIZED"
  | "ASSET_MATCHED"
  | "VALIDATED"
  | "RECONCILED"
  | "APPLIED"
  | "CONFLICT_DETECTED"
  | "REJECTED"
  | "DUPLICATE";

export type ProcessingStepStatus = "passed" | "failed" | "stopped" | "pending";

export type MatchResultKind = "MATCHED" | "AMBIGUOUS" | "NOT_FOUND";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type ConflictType =
  | "QUANTITY_MISMATCH"
  | "LOCATION_MISMATCH"
  | "LIFECYCLE_MISMATCH"
  | "VALUE_MISMATCH"
  | "DUPLICATE_EVENT"
  | "INVALID_EVENT_SEQUENCE";

export type ConflictStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "IGNORED";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type RawEventPayload = Record<string, JsonValue>;

export interface ProcessingStep {
  key: ProcessingStepKey;
  label: string;
  status: ProcessingStepStatus;
  detail: string;
}

export interface IntegrationEvent {
  id: string;
  externalEventId: string;
  assetId: string | null;
  source: EventSource;
  sourceSystem: string;
  eventType: EventType;
  eventCategory: IntegrationEventCategory;
  timestamp: string;
  receivedAt: string;
  severity: EventSeverity;
  status: EventProcessingStatus;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  payload: RawEventPayload;
  rawPayload: RawEventPayload;
  processingSteps: ProcessingStep[];
  explanation: string;
  errorMessage?: string;
  conflictDetected: boolean;
  createdAt: string;
}

export interface ConflictRecord {
  id: string;
  assetId: string;
  eventId: string;
  type: ConflictType;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  expectedValue: string;
  actualValue: string;
  difference: string;
  status: ConflictStatus;
  detectedAt: string;
  sourceSystems: EventSource[];
}

export interface TwinPatch {
  assetId: string;
  productionCompletion?: number;
  currentValue?: number;
  currentStage?: LifecycleStage;
  verificationStatus?: VerificationStatus;
  location?: string;
  quantity?: number;
  attention?: boolean;
  situation?: string;
  lastUpdated: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MatchResult {
  kind: MatchResultKind;
  assetId: string | null;
  reason: string;
}

export interface ReconciliationFinding {
  field: string;
  status: "VALID_UPDATE" | "CONFLICT" | "NO_CHANGE" | "INVALID_EVENT_ORDER";
  expected?: string;
  actual?: string;
  difference?: string;
  message: string;
}

export interface ProcessEventResult {
  event: IntegrationEvent;
  conflict?: ConflictRecord;
  patch?: TwinPatch;
}
