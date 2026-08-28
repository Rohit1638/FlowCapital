import type { LifecycleStage } from "./asset";

export type EventSeverity = "info" | "success" | "warning" | "critical";

export type EventCategory =
  | "shipment"
  | "warehouse"
  | "invoice"
  | "production"
  | "risk"
  | "financing"
  | "procurement"
  | "verification"
  | "physical"
  | "contract";

export type EventDomain = "physical" | "financial" | "risk" | "verification";

export interface LifecycleEvent {
  id: string;
  assetId: string;
  type: string;
  stage: LifecycleStage;
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  severity: EventSeverity;
  category: EventCategory;
  domain: EventDomain;
  source: string;
  metadata?: Record<string, string | number | boolean>;
}
