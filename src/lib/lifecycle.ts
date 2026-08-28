import { LIFECYCLE_STAGES, type LifecycleStage, type RiskLevel } from "@/types/asset";

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  PURCHASE_ORDER: "Purchase Order",
  PROCUREMENT: "Procurement",
  RAW_MATERIAL: "Raw Material",
  PRODUCTION: "In Production",
  FINISHED_GOODS: "Finished Goods",
  IN_TRANSIT: "In Transit",
  WAREHOUSE: "Warehouse",
  DELIVERED: "Delivered",
  INVOICE: "Invoiced",
  RECEIVABLE: "Receivable",
  CASH_REALISED: "Cash Realised",
};

export const STAGE_SHORT_LABELS: Record<LifecycleStage, string> = {
  PURCHASE_ORDER: "PO",
  PROCUREMENT: "PROCURE",
  RAW_MATERIAL: "RAW",
  PRODUCTION: "PRODUCTION",
  FINISHED_GOODS: "FINISHED",
  IN_TRANSIT: "IN TRANSIT",
  WAREHOUSE: "WAREHOUSE",
  DELIVERED: "DELIVERED",
  INVOICE: "INVOICED",
  RECEIVABLE: "RECEIVABLE",
  CASH_REALISED: "CASH",
};

export const ALLOWED_TRANSITIONS: Record<LifecycleStage, LifecycleStage[]> = {
  PURCHASE_ORDER: ["PROCUREMENT"],
  PROCUREMENT: ["RAW_MATERIAL"],
  RAW_MATERIAL: ["PRODUCTION"],
  PRODUCTION: ["FINISHED_GOODS"],
  FINISHED_GOODS: ["IN_TRANSIT"],
  IN_TRANSIT: ["WAREHOUSE"],
  WAREHOUSE: ["DELIVERED"],
  DELIVERED: ["INVOICE"],
  INVOICE: ["RECEIVABLE"],
  RECEIVABLE: ["CASH_REALISED"],
  CASH_REALISED: [],
};

export function getLifecycleLabel(stage: LifecycleStage): string {
  return STAGE_LABELS[stage];
}

export function getStageIndex(stage: LifecycleStage): number {
  return LIFECYCLE_STAGES.indexOf(stage);
}

export function canTransition(from: LifecycleStage, to: LifecycleStage): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: LifecycleStage, to: LifecycleStage): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid lifecycle transition: ${from} → ${to}`);
  }
}

export function getNextStage(from: LifecycleStage): LifecycleStage | null {
  return ALLOWED_TRANSITIONS[from][0] ?? null;
}

export function isStageComplete(current: LifecycleStage, candidate: LifecycleStage): boolean {
  return getStageIndex(candidate) < getStageIndex(current);
}

export function isStageCurrent(current: LifecycleStage, candidate: LifecycleStage): boolean {
  return current === candidate;
}

export function getRiskLabel(score: number, closed = false): RiskLevel {
  if (closed) return "CLOSED";
  if (score >= 75) return "HIGH";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export function getRiskColorClass(level: RiskLevel): string {
  switch (level) {
    case "LOW":
      return "text-ink bg-lime/25";
    case "MEDIUM":
      return "text-ink bg-[#f0e6c8]";
    case "HIGH":
    case "CRITICAL":
      return "text-lime bg-ink";
    case "CLOSED":
      return "text-muted-foreground bg-muted";
  }
}
