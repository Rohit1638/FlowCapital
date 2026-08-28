import type { EventSource, RawEventPayload } from "@/types/integration";

export interface ScenarioStep {
  id: string;
  source: EventSource;
  title: string;
  raw: RawEventPayload;
}

export interface DemoScenario {
  id: "production-progression" | "warehouse-conflict" | "invalid-payment";
  name: string;
  assetId: string;
  summary: string;
  steps: ScenarioStep[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "production-progression",
    name: "DA-2026-001 · Production progression",
    assetId: "DA-2026-001",
    summary: "MES and ERP move Batch A-452 from 65% WIP to verified finished goods.",
    steps: [
      {
        id: "scn1-80",
        source: "PRODUCTION",
        title: "Production 80%",
        raw: {
          eventType: "PRODUCTION_PROGRESS_UPDATED",
          batchId: "DA-2026-001",
          completionPercentage: 80,
          status: "IN_PROGRESS",
          value: 4_780_000,
          recordedAt: new Date().toISOString(),
        },
      },
      {
        id: "scn1-qc",
        source: "VERIFICATION",
        title: "Quality verified",
        raw: {
          eventType: "QUALITY_VERIFIED",
          assetId: "DA-2026-001",
          subject: "In-process quality check",
          result: "PASS",
          verifiedAt: new Date().toISOString(),
        },
      },
      {
        id: "scn1-100",
        source: "PRODUCTION",
        title: "Production 100%",
        raw: {
          eventType: "PRODUCTION_COMPLETED",
          batchId: "DA-2026-001",
          completionPercentage: 100,
          status: "COMPLETED",
          value: 5_200_000,
          recordedAt: new Date().toISOString(),
        },
      },
      {
        id: "scn1-fg",
        source: "ERP",
        title: "Finished goods confirmed",
        raw: {
          event_id: "ERP-001-FG-LIVE",
          event_code: "FINISHED_GOODS_CONFIRMED",
          asset_ref: "DA-2026-001",
          po_no: "PO-APX-2026-0842",
          value: 5_200_000,
          event_time: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: "warehouse-conflict",
    name: "DA-2026-003 · Warehouse quantity conflict",
    assetId: "DA-2026-003",
    summary: "Production reports 1,200 units; warehouse reports 1,140. Difference 60.",
    steps: [
      {
        id: "scn2-prod",
        source: "PRODUCTION",
        title: "Production quantity 1,200",
        raw: {
          eventType: "QUALITY_CHECK_COMPLETED",
          batchId: "DA-2026-003",
          completionPercentage: 100,
          status: "COMPLETED",
          quantity: 1200,
          recordedAt: new Date().toISOString(),
        },
      },
      {
        id: "scn2-wh",
        source: "WAREHOUSE",
        title: "Warehouse quantity 1,140",
        raw: {
          event_id: "WMS-003-MISMATCH",
          event_code: "QUANTITY_MISMATCH_DETECTED",
          asset_id: "DA-2026-003",
          expected_qty: 1200,
          actual_qty: 1140,
          location_code: "PUN-CW-01",
          recorded_at: new Date().toISOString(),
        },
      },
    ],
  },
  {
    id: "invalid-payment",
    name: "DA-2026-004 · Invalid payment sequence",
    assetId: "DA-2026-004",
    summary: "Finance posts PAYMENT_RECEIVED while the twin is still a purchase order.",
    steps: [
      {
        id: "scn3-pay",
        source: "FINANCE",
        title: "Payment received",
        raw: {
          event_code: "PAYMENT_RECEIVED",
          asset_ref: "DA-2026-004",
          amount: 7_800_000,
          posted_at: new Date().toISOString(),
        },
      },
    ],
  },
];
