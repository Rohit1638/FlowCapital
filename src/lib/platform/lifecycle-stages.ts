export const LIFECYCLE_TRACKER_STAGES = [
  { code: "PO_SIGNED", label: "PO Signed", progressPct: 18 },
  { code: "RAW_MATERIAL", label: "Raw Material", progressPct: 35 },
  { code: "PRODUCTION", label: "Production", progressPct: 58 },
  { code: "FINISHED_GOODS", label: "Finished Goods", progressPct: 75 },
  { code: "IN_TRANSIT", label: "In Transit", progressPct: 85 },
  { code: "INVOICED", label: "Invoiced", progressPct: 95 },
  { code: "SETTLED", label: "Settled", progressPct: 100 },
] as const;

export type LifecycleTrackerCode = (typeof LIFECYCLE_TRACKER_STAGES)[number]["code"];

const STAGE_ALIASES: Record<string, LifecycleTrackerCode> = {
  PURCHASE_ORDER: "PO_SIGNED",
  PO_SIGNED: "PO_SIGNED",
  RAW_MATERIAL: "RAW_MATERIAL",
  PROCUREMENT: "RAW_MATERIAL",
  PRODUCTION_STARTED: "PRODUCTION",
  IN_PRODUCTION: "PRODUCTION",
  PRODUCTION: "PRODUCTION",
  QUALITY_CHECK: "PRODUCTION",
  FINISHED_GOODS: "FINISHED_GOODS",
  WAREHOUSE: "IN_TRANSIT",
  SHIPMENT: "IN_TRANSIT",
  DELIVERY: "IN_TRANSIT",
  IN_TRANSIT: "IN_TRANSIT",
  INVOICE: "INVOICED",
  RECEIVABLE: "INVOICED",
  INVOICED: "INVOICED",
  SETTLEMENT: "SETTLED",
  CASH_REALISED: "SETTLED",
  SETTLED: "SETTLED",
};

export function normalizeLifecycleStage(stage: string): LifecycleTrackerCode {
  const key = stage.toUpperCase().replace(/\s+/g, "_");
  return STAGE_ALIASES[key] ?? "PO_SIGNED";
}

export function stageIndex(code: LifecycleTrackerCode): number {
  return LIFECYCLE_TRACKER_STAGES.findIndex((s) => s.code === code);
}

export function stageState(
  stageCode: LifecycleTrackerCode,
  currentCode: LifecycleTrackerCode,
): "completed" | "active" | "upcoming" {
  const currentIdx = stageIndex(currentCode);
  const idx = stageIndex(stageCode);
  if (idx < currentIdx) return "completed";
  if (idx === currentIdx) return "active";
  return "upcoming";
}
