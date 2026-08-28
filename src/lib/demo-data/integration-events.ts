import type { EventSource, ProcessEventResult, RawEventPayload } from "@/types/integration";
import { baseAssets } from "@/lib/demo-data/assets";
import { processIncomingEvent } from "@/lib/integration/process";

interface SeedSpec {
  id: string;
  source: EventSource;
  raw: RawEventPayload;
}

const seeds: SeedSpec[] = [
  {
    id: "hist-001-po",
    source: "ERP",
    raw: {
      event_id: "ERP-PO-001-CREATE",
      event_code: "PURCHASE_ORDER_CREATED",
      po_no: "PO-APX-2026-0842",
      asset_ref: "DA-2026-001",
      event_time: "2026-08-15T06:10:00.000Z",
    },
  },
  {
    id: "hist-001-pov",
    source: "ERP",
    raw: {
      event_id: "ERP-PO-001-VER",
      event_code: "PURCHASE_ORDER_VERIFIED",
      po_no: "PO-APX-2026-0842",
      asset_ref: "DA-2026-001",
      event_time: "2026-08-16T08:40:00.000Z",
    },
  },
  {
    id: "hist-001-proc",
    source: "ERP",
    raw: {
      event_id: "ERP-001-PROC",
      event_code: "PROCUREMENT_COMPLETED",
      asset_ref: "DA-2026-001",
      event_time: "2026-08-20T09:00:00.000Z",
    },
  },
  {
    id: "hist-001-start",
    source: "PRODUCTION",
    raw: {
      eventType: "PRODUCTION_STARTED",
      batchId: "DA-2026-001",
      status: "IN_PROGRESS",
      recordedAt: "2026-08-24T04:40:00.000Z",
    },
  },
  {
    id: "hist-001-65",
    source: "PRODUCTION",
    raw: {
      eventType: "PRODUCTION_PROGRESS_UPDATED",
      batchId: "DA-2026-001",
      completionPercentage: 65,
      status: "IN_PROGRESS",
      value: 4_250_000,
      recordedAt: "2026-08-28T07:20:00.000Z",
    },
  },
  {
    id: "hist-002-ship",
    source: "LOGISTICS",
    raw: {
      eventType: "SHIPMENT_CREATED",
      assetId: "DA-2026-002",
      shipmentId: "SHP-C219",
      location: "Chennai CFS",
      timestamp: "2026-08-27T03:30:00.000Z",
    },
  },
  {
    id: "hist-002-loc",
    source: "LOGISTICS",
    raw: {
      eventType: "SHIPMENT_LOCATION_UPDATED",
      assetId: "DA-2026-002",
      location: "NH-48 corridor, near Pune",
      timestamp: "2026-08-28T06:40:00.000Z",
    },
  },
  {
    id: "hist-002-ver",
    source: "VERIFICATION",
    raw: {
      eventType: "LOCATION_VERIFIED",
      assetId: "DA-2026-002",
      result: "PASS",
      verifiedAt: "2026-08-28T06:42:00.000Z",
    },
  },
  {
    id: "hist-003-wh",
    source: "WAREHOUSE",
    raw: {
      event_code: "WAREHOUSE_RECEIVED",
      asset_id: "DA-2026-003",
      expected_qty: 1200,
      actual_qty: 1200,
      location_code: "PUN-CW-01",
      recorded_at: "2026-08-26T12:10:00.000Z",
    },
  },
  {
    id: "hist-004-po",
    source: "ERP",
    raw: {
      event_id: "ERP-004-PO",
      event_code: "PURCHASE_ORDER_VERIFIED",
      po_no: "PO-ECP-2026-341",
      asset_ref: "DA-2026-004",
      event_time: "2026-08-26T09:30:00.000Z",
    },
  },
  {
    id: "hist-004-doc",
    source: "VERIFICATION",
    raw: {
      eventType: "DOCUMENT_VERIFIED",
      assetId: "DA-2026-004",
      subject: "PO-ECP-2026-341",
      result: "PASS",
      verifiedAt: "2026-08-27T11:00:00.000Z",
    },
  },
  {
    id: "hist-005-rm",
    source: "VERIFICATION",
    raw: {
      eventType: "QUALITY_VERIFIED",
      assetId: "DA-2026-005",
      subject: "Pharma intermediates QC",
      result: "PASS",
      verifiedAt: "2026-08-27T16:40:00.000Z",
    },
  },
  {
    id: "hist-006-fg",
    source: "PRODUCTION",
    raw: {
      eventType: "PRODUCTION_COMPLETED",
      batchId: "DA-2026-006",
      completionPercentage: 100,
      status: "COMPLETED",
      recordedAt: "2026-08-27T11:20:00.000Z",
    },
  },
  {
    id: "hist-006-erp",
    source: "ERP",
    raw: {
      event_code: "FINISHED_GOODS_CONFIRMED",
      asset_ref: "DA-2026-006",
      event_time: "2026-08-27T11:30:00.000Z",
    },
  },
  {
    id: "hist-007-del",
    source: "LOGISTICS",
    raw: {
      eventType: "DELIVERY_CONFIRMED",
      assetId: "DA-2026-007",
      location: "Hyderabad DC",
      timestamp: "2026-08-26T14:00:00.000Z",
    },
  },
  {
    id: "hist-007-inv",
    source: "FINANCE",
    raw: {
      event_code: "INVOICE_GENERATED",
      asset_ref: "DA-2026-007",
      invoice_no: "INV-FH-2026-4410",
      amount: 2_450_000,
      posted_at: "2026-08-27T09:15:00.000Z",
    },
  },
  {
    id: "hist-007-ver",
    source: "FINANCE",
    raw: {
      event_code: "INVOICE_VERIFIED",
      asset_ref: "DA-2026-007",
      invoice_no: "INV-FH-2026-4410",
      posted_at: "2026-08-27T09:40:00.000Z",
    },
  },
  {
    id: "hist-008-pay",
    source: "FINANCE",
    raw: {
      event_code: "PAYMENT_RECEIVED",
      asset_ref: "DA-2026-008",
      amount: 3_600_000,
      posted_at: "2026-08-21T10:40:00.000Z",
    },
  },
  {
    id: "hist-008-asset",
    source: "VERIFICATION",
    raw: {
      eventType: "ASSET_VERIFIED",
      assetId: "DA-2026-008",
      result: "PASS",
      verifiedAt: "2026-08-21T10:50:00.000Z",
    },
  },
  {
    id: "hist-002-delay",
    source: "LOGISTICS",
    raw: {
      eventType: "SHIPMENT_DELAY_DETECTED",
      assetId: "DA-2026-002",
      delayHours: 0,
      location: "On schedule",
      timestamp: "2026-08-28T06:41:00.000Z",
    },
  },
  {
    id: "hist-005-erp",
    source: "ERP",
    raw: {
      event_code: "PROCUREMENT_COMPLETED",
      asset_ref: "DA-2026-005",
      event_time: "2026-08-22T08:00:00.000Z",
    },
  },
  {
    id: "hist-001-qc-hist",
    source: "VERIFICATION",
    raw: {
      eventType: "DOCUMENT_VERIFIED",
      assetId: "DA-2026-001",
      subject: "Mill certificate",
      result: "PASS",
      verifiedAt: "2026-08-22T07:20:00.000Z",
    },
  },
  {
    id: "hist-001-proc-start",
    source: "ERP",
    raw: {
      event_id: "ERP-001-PROC-START",
      event_code: "PROCUREMENT_STARTED",
      asset_ref: "DA-2026-001",
      po_no: "PO-APX-2026-0842",
      event_time: "2026-08-18T06:00:00.000Z",
    },
  },
  {
    id: "hist-003-inv",
    source: "WAREHOUSE",
    raw: {
      event_id: "WMS-003-INV",
      event_code: "INVENTORY_STATUS_UPDATED",
      asset_id: "DA-2026-003",
      expected_qty: 1200,
      actual_qty: 1200,
      location_code: "PUN-CW-01",
      recorded_at: "2026-08-26T12:40:00.000Z",
    },
  },
  {
    id: "hist-003-asset",
    source: "VERIFICATION",
    raw: {
      eventType: "ASSET_VERIFIED",
      assetId: "DA-2026-003",
      result: "PASS",
      verifiedAt: "2026-08-26T13:00:00.000Z",
    },
  },
  {
    id: "hist-003-loc",
    source: "VERIFICATION",
    raw: {
      eventType: "LOCATION_VERIFIED",
      assetId: "DA-2026-003",
      result: "PASS",
      verifiedAt: "2026-08-26T13:05:00.000Z",
    },
  },
  {
    id: "hist-004-po-create",
    source: "ERP",
    raw: {
      event_id: "ERP-004-PO-CREATE",
      event_code: "PURCHASE_ORDER_CREATED",
      po_no: "PO-ECP-2026-341",
      asset_ref: "DA-2026-004",
      event_time: "2026-08-26T08:10:00.000Z",
    },
  },
  {
    id: "hist-005-prod-start",
    source: "PRODUCTION",
    raw: {
      eventType: "PRODUCTION_STARTED",
      batchId: "DA-2026-005",
      status: "IN_PROGRESS",
      recordedAt: "2026-08-27T17:10:00.000Z",
    },
  },
  {
    id: "hist-006-ship",
    source: "LOGISTICS",
    raw: {
      eventType: "SHIPMENT_CREATED",
      assetId: "DA-2026-006",
      shipmentId: "SHP-FG-006",
      location: "Chennai finished-goods bay",
      timestamp: "2026-08-27T12:00:00.000Z",
    },
  },
  {
    id: "hist-007-pay-watch",
    source: "FINANCE",
    raw: {
      event_code: "PAYMENT_DELAY_DETECTED",
      asset_ref: "DA-2026-007",
      invoice_no: "INV-FH-2026-4410",
      amount: 2_450_000,
      posted_at: "2026-08-28T08:00:00.000Z",
    },
  },
  {
    id: "hist-002-doc",
    source: "VERIFICATION",
    raw: {
      eventType: "DOCUMENT_VERIFIED",
      assetId: "DA-2026-002",
      subject: "Bill of lading C-219",
      result: "PASS",
      verifiedAt: "2026-08-27T04:00:00.000Z",
    },
  },
];

function seedAll(): ProcessEventResult[] {
  const results: ProcessEventResult[] = [];
  const events = [];
  for (const spec of seeds) {
    const result = processIncomingEvent(spec.source, spec.raw, baseAssets, events, { id: spec.id });
    events.push(result.event);
    results.push(result);
  }
  return results;
}

const seeded = seedAll();

export const seedProcessResults = seeded;
export const seedIntegrationEvents = seeded.map((item) => item.event);
export const seedConflicts = seeded.flatMap((item) => (item.conflict ? [item.conflict] : []));
