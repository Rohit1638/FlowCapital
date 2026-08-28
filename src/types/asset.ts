export const LIFECYCLE_STAGES = [
  "PURCHASE_ORDER",
  "PROCUREMENT",
  "RAW_MATERIAL",
  "PRODUCTION",
  "FINISHED_GOODS",
  "IN_TRANSIT",
  "WAREHOUSE",
  "DELIVERED",
  "INVOICE",
  "RECEIVABLE",
  "CASH_REALISED",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "CLOSED";

export type FinancingStatus =
  | "UNFINANCED"
  | "PENDING_REVIEW"
  | "PARTIAL"
  | "FINANCED"
  | "REFINANCE_ELIGIBLE"
  | "SETTLED";

export type AssetStatus = "ACTIVE" | "SETTLED" | "WATCH";

export type VerificationStatus = "VERIFIED" | "PENDING_SYNC" | "MISMATCH" | "NOT_APPLICABLE";

export type AssetCondition = "GOOD" | "WATCH" | "IMPAIRED" | "SETTLED";

export interface PhysicalState {
  assetId: string;
  stage: LifecycleStage;
  location: string;
  origin?: string;
  destination?: string;
  quantity: number;
  unit: string;
  productionCompletion: number;
  condition: AssetCondition;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  shipmentStatus?: string;
}

export interface FinancialState {
  assetId: string;
  originalValue: number;
  currentValue: number;
  financedAmount: number;
  availableFinancing: number;
  outstandingExposure: number;
  invoiceValue?: number;
  currency: "INR";
  financingStatus: FinancingStatus;
}

export interface ContractualState {
  assetId: string;
  purchaseOrderNumber: string;
  buyer: string;
  supplier: string;
  paymentTerms: string;
  deliveryDate: string;
  invoiceNumber?: string;
  invoiceValue?: number;
  expectedPaymentDate?: string;
  contractStatus: string;
  ownershipStatus: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  owner: string;
  buyer: string;
  supplier: string;
  currentStage: LifecycleStage;
  currentValue: number;
  originalValue: number;
  currency: "INR";
  quantity: number;
  unit: string;
  location: string;
  status: AssetStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  financingStatus: FinancingStatus;
  financedAmount: number;
  availableFinancing: number;
  availableAmount: number;
  createdAt: string;
  lastUpdated: string;
  attention?: boolean;
  situation: string;
  physical: PhysicalState;
  financial: FinancialState;
  contractual: ContractualState;
}

export interface LifecycleAggregate {
  stage: LifecycleStage;
  assetCount: number;
  totalValue: number;
  attention: boolean;
}

export interface CapitalOverview {
  assetsUnderManagement: number;
  aumChangePct: number;
  capitalDeployed: number;
  deployedChangePct: number;
  availableFinancing: number;
  availableChangePct: number;
  assetsRequiringAttention: number;
  attentionChangePct: number;
}

export interface FinancialMovementPoint {
  label: string;
  assetValue: number;
  capitalDeployed: number;
}

export interface DataSource {
  id: string;
  assetId: string;
  name: string;
  status: VerificationStatus;
  confidence: number;
  applicable: boolean;
}
