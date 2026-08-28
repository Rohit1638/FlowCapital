import type { LifecycleStage } from "@/types/asset";

/** Stable demo clock so freshness does not drift during a live presentation. */
export const DEMO_AS_OF = "2026-08-28T12:00:00.000Z";

/**
 * Prototype recoverable-value bands by lifecycle stage.
 * These are demo assumptions, not universal lending rules.
 */
export const STAGE_REALIZABLE_BAND: Record<LifecycleStage, { min: number; max: number }> = {
  PURCHASE_ORDER: { min: 0.95, max: 1.0 },
  PROCUREMENT: { min: 0.5, max: 0.65 },
  RAW_MATERIAL: { min: 0.82, max: 0.9 },
  PRODUCTION: { min: 0.55, max: 0.945 },
  FINISHED_GOODS: { min: 0.85, max: 0.95 },
  IN_TRANSIT: { min: 0.8, max: 0.94 },
  WAREHOUSE: { min: 0.85, max: 0.96 },
  DELIVERED: { min: 0.9, max: 1 },
  INVOICE: { min: 0.88, max: 0.96 },
  RECEIVABLE: { min: 0.85, max: 0.92 },
  CASH_REALISED: { min: 0, max: 0 },
};

/** Preserves the Module 2/3 DA-2026-001 story: 65% → ₹42.5L, 80% → ₹47.8L, 100% → ₹52L. */
export const PRODUCTION_VALUE_ANCHORS: Record<string, { completion: number; value: number }[]> = {
  "DA-2026-001": [
    { completion: 0, value: 2_200_000 },
    { completion: 65, value: 4_250_000 },
    { completion: 80, value: 4_780_000 },
    { completion: 100, value: 5_200_000 },
  ],
};

export const FINISHED_GOODS_ANCHORS: Record<string, number> = {
  "DA-2026-001": 5_200_000,
};

export const RISK_ADJUSTMENT_BY_LEVEL = {
  LOW: { min: 0.95, max: 1 },
  MEDIUM: { min: 0.8, max: 0.94 },
  HIGH: { min: 0.6, max: 0.79 },
  CRITICAL: { min: 0.4, max: 0.59 },
  CLOSED: { min: 1, max: 1 },
} as const;

export const VALUATION_DISCLAIMER =
  "Decision-support estimate from lifecycle-aware prototype bands. Not a market appraisal or credit approval.";
