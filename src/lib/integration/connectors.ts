import type { EventSource, IntegrationEventCategory } from "@/types/integration";

export type ConnectorIconKey =
  | "erp"
  | "production"
  | "warehouse"
  | "logistics"
  | "finance"
  | "verification";

export interface ConnectorDefinition {
  id: EventSource;
  name: string;
  purpose: string;
  statusLabel: "SIMULATED LIVE";
  health: number;
  eventsProcessed: number;
  lastSync: string;
  confidence: number;
  tone: "dark" | "lime" | "light";
  icon: ConnectorIconKey;
}

export const CONNECTORS: ConnectorDefinition[] = [
  {
    id: "ERP",
    name: "Enterprise Resource Planning",
    purpose: "Purchase orders, procurement, production records.",
    statusLabel: "SIMULATED LIVE",
    health: 98.7,
    eventsProcessed: 142,
    lastSync: "Just now",
    confidence: 95,
    tone: "dark",
    icon: "erp",
  },
  {
    id: "PRODUCTION",
    name: "Manufacturing Execution System",
    purpose: "Production progress and completion.",
    statusLabel: "SIMULATED LIVE",
    health: 96.4,
    eventsProcessed: 88,
    lastSync: "12s ago",
    confidence: 92,
    tone: "lime",
    icon: "production",
  },
  {
    id: "WAREHOUSE",
    name: "Warehouse Management System",
    purpose: "Inventory verification and warehouse movement.",
    statusLabel: "SIMULATED LIVE",
    health: 91.2,
    eventsProcessed: 64,
    lastSync: "41s ago",
    confidence: 90,
    tone: "light",
    icon: "warehouse",
  },
  {
    id: "LOGISTICS",
    name: "Logistics & Shipment Tracking",
    purpose: "Shipment movement and delivery.",
    statusLabel: "SIMULATED LIVE",
    health: 94.1,
    eventsProcessed: 57,
    lastSync: "2m ago",
    confidence: 88,
    tone: "light",
    icon: "logistics",
  },
  {
    id: "FINANCE",
    name: "Finance & Invoice System",
    purpose: "Invoice and payment lifecycle.",
    statusLabel: "SIMULATED LIVE",
    health: 99.1,
    eventsProcessed: 39,
    lastSync: "6m ago",
    confidence: 96,
    tone: "dark",
    icon: "finance",
  },
  {
    id: "VERIFICATION",
    name: "Verification & IoT Layer",
    purpose: "Asset, document, location, and quality verification.",
    statusLabel: "SIMULATED LIVE",
    health: 97.0,
    eventsProcessed: 51,
    lastSync: "18s ago",
    confidence: 94,
    tone: "lime",
    icon: "verification",
  },
];

export const SOURCE_RELIABILITY: Record<EventSource, number> = {
  ERP: 95,
  PRODUCTION: 92,
  WAREHOUSE: 90,
  LOGISTICS: 88,
  FINANCE: 96,
  VERIFICATION: 94,
};

export const SOURCE_LABELS: Record<EventSource, string> = {
  ERP: "ERP System",
  PRODUCTION: "Production System",
  WAREHOUSE: "Warehouse System",
  LOGISTICS: "Logistics System",
  FINANCE: "Finance System",
  VERIFICATION: "Verification System",
};

export const SOURCE_CATEGORY: Record<EventSource, IntegrationEventCategory> = {
  ERP: "procurement",
  PRODUCTION: "production",
  WAREHOUSE: "warehouse",
  LOGISTICS: "logistics",
  FINANCE: "finance",
  VERIFICATION: "verification",
};
