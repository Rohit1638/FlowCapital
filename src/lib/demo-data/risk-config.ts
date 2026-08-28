import type { LifecycleStage } from "@/types/asset";
import type { RiskFactorId } from "@/types/intelligence";

export const RISK_WEIGHTS: Record<RiskFactorId, number> = {
  lifecycle: 20,
  dataConfidence: 15,
  verification: 15,
  conflict: 20,
  operational: 10,
  freshness: 5,
  logistics: 10,
  financial: 5,
};

export const LIFECYCLE_UNCERTAINTY: Record<LifecycleStage, number> = {
  PURCHASE_ORDER: 10,
  PROCUREMENT: 14,
  RAW_MATERIAL: 12,
  PRODUCTION: 16,
  FINISHED_GOODS: 16,
  IN_TRANSIT: 11,
  WAREHOUSE: 10,
  DELIVERED: 6,
  INVOICE: 7,
  RECEIVABLE: 9,
  CASH_REALISED: 0,
};

export const BASE_LTV: Record<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "CLOSED", number> = {
  LOW: 75,
  MEDIUM: 65,
  HIGH: 50,
  CRITICAL: 30,
  CLOSED: 0,
};

export const LTV_FLOOR = 25;
export const LTV_CEILING = 80;

export const RISK_BANDS = {
  LOW: { max: 25, label: "LOW RISK" },
  MEDIUM: { max: 50, label: "MEDIUM RISK" },
  HIGH: { max: 75, label: "HIGH RISK" },
  CRITICAL: { max: 100, label: "CRITICAL RISK" },
} as const;

/** Historical assessment points used for trend charts. Not random. */
export const DEMO_RISK_PATHS: Record<string, { score: number; reason: string; timestamp: string }[]> = {
  "DA-2026-001": [
    { score: 58, reason: "Purchase order originated with supplier-concentration uncertainty.", timestamp: "2026-08-15T06:10:00.000Z" },
    { score: 51, reason: "Production started. WIP concentration increased.", timestamp: "2026-08-24T04:40:00.000Z" },
    { score: 42, reason: "Verified production at 65% with a short raw-material delay.", timestamp: "2026-08-28T07:20:00.000Z" },
  ],
  "DA-2026-002": [
    { score: 31, reason: "Gated out of Chennai CFS.", timestamp: "2026-08-27T03:30:00.000Z" },
    { score: 24, reason: "On-schedule line-haul with verified location.", timestamp: "2026-08-28T06:40:00.000Z" },
  ],
  "DA-2026-003": [
    { score: 35, reason: "Warehouse receipt posted against full production quantity.", timestamp: "2026-08-26T12:20:00.000Z" },
    { score: 62, reason: "Quantity mismatch between production close and warehouse count.", timestamp: "2026-08-28T05:10:00.000Z" },
  ],
  "DA-2026-004": [
    { score: 22, reason: "Verified EcoPower purchase order committed.", timestamp: "2026-08-26T09:30:00.000Z" },
    { score: 18, reason: "Document verification passed. Title not yet transferred.", timestamp: "2026-08-27T11:00:00.000Z" },
  ],
};
