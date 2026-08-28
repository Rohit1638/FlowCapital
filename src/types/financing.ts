import type { FinancingStatus } from "./asset";

export type FinancingInstrument =
  | "PO_FINANCING"
  | "PROCUREMENT_FINANCING"
  | "INVENTORY_FINANCING"
  | "PRODUCTION_FINANCING"
  | "IN_TRANSIT_FINANCING"
  | "WAREHOUSE_RECEIPT"
  | "INVOICE_DISCOUNTING"
  | "RECEIVABLE_FINANCING";

export type FinancingRecordStatus = FinancingStatus | "ACTIVE" | "CLOSED";

export interface FinancingRecord {
  id: string;
  assetId: string;
  instrument: FinancingInstrument;
  amount: number;
  availableAmount: number;
  status: FinancingRecordStatus;
  lender: string;
  startDate: string;
  endDate?: string;
  reason: string;
  updatedAt: string;
}

export interface AIInsight {
  id: string;
  heading: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  assetId: string;
  suggestedInstrument: FinancingInstrument;
}
