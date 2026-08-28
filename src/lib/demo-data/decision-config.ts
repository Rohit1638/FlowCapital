import type { LifecycleStage, VerificationStatus } from "@/types/asset";
import type {
  AllocationStrategy,
  DecisionCategory,
  FundingReadinessBand,
  OpportunityFactorId,
} from "@/types/decisions";
import type { IntelligenceRiskLevel } from "@/types/intelligence";

export const DECISION_DISCLAIMER =
  "These are decision-support recommendations. They are not a loan approval, credit decision, or disbursement.";

export const DECISION_STORAGE_KEY = "flowcapital.decisions.v1";

export const OPPORTUNITY_WEIGHTS: Record<OpportunityFactorId, number> = {
  capacity: 25,
  risk: 25,
  confidence: 15,
  verification: 15,
  conflict: 10,
  maturity: 5,
  efficiency: 5,
};

export const OPPORTUNITY_FACTOR_LABELS: Record<OpportunityFactorId, string> = {
  capacity: "Financing Capacity Strength",
  risk: "Risk Profile",
  confidence: "Data Confidence",
  verification: "Verification Quality",
  conflict: "Conflict Status",
  maturity: "Operational Maturity",
  efficiency: "Funding Efficiency",
};

/** Converts Module 4 risk (higher = worse) into opportunity points (higher = better). */
export const RISK_OPPORTUNITY_POINTS: Record<IntelligenceRiskLevel, number> = {
  LOW: 25,
  MEDIUM: 16,
  HIGH: 6,
  CRITICAL: 2,
  CLOSED: 0,
};

export const VERIFICATION_OPPORTUNITY_POINTS: Record<VerificationStatus, number> = {
  VERIFIED: 15,
  PENDING_SYNC: 7,
  MISMATCH: 2,
  NOT_APPLICABLE: 4,
};

/** Lifecycle discount on capacity points so the largest PO does not auto-win. */
export const CAPACITY_MATURITY_MULTIPLIER: Record<LifecycleStage, number> = {
  PURCHASE_ORDER: 0.32,
  PROCUREMENT: 0.42,
  RAW_MATERIAL: 0.52,
  PRODUCTION: 0.78,
  FINISHED_GOODS: 1,
  IN_TRANSIT: 0.96,
  WAREHOUSE: 0.9,
  DELIVERED: 1,
  INVOICE: 0.94,
  RECEIVABLE: 0.86,
  CASH_REALISED: 0,
};

export const MATURITY_POINTS: Record<LifecycleStage, number> = {
  PURCHASE_ORDER: 1,
  PROCUREMENT: 1.5,
  RAW_MATERIAL: 2,
  PRODUCTION: 3,
  FINISHED_GOODS: 4.8,
  IN_TRANSIT: 4.4,
  WAREHOUSE: 4.1,
  DELIVERED: 5,
  INVOICE: 4.6,
  RECEIVABLE: 4,
  CASH_REALISED: 0.4,
};

export const READINESS_WEIGHTS = {
  verification: 20,
  conflict: 25,
  freshness: 10,
  risk: 20,
  confidence: 15,
  lifecycle: 10,
} as const;

export const READINESS_BANDS: { min: number; band: FundingReadinessBand }[] = [
  { min: 80, band: "READY_NOW" },
  { min: 60, band: "NEARLY_READY" },
  { min: 40, band: "CONDITIONAL" },
  { min: 0, band: "NOT_READY" },
];

export const DECISION_THRESHOLDS = {
  priorityOpportunity: 75,
  priorityReadiness: 75,
  conditionalOpportunity: 55,
  conditionalReadiness: 50,
  minimumPriorityCapacity: 500_000,
  lowConfidenceHold: 60,
  staleDaysHold: 21,
} as const;

export const DECISION_CATEGORY_ORDER: Record<DecisionCategory, number> = {
  PRIORITY_FUNDING: 0,
  CONDITIONAL_FUNDING: 1,
  HOLD_FOR_REVIEW: 2,
  NOT_CURRENTLY_PRIORITIZED: 3,
};

export const DECISION_LABELS: Record<DecisionCategory, string> = {
  PRIORITY_FUNDING: "RECOMMENDED FOR PRIORITY FUNDING",
  CONDITIONAL_FUNDING: "CONDITIONALLY RECOMMENDED",
  HOLD_FOR_REVIEW: "HOLD FOR REVIEW",
  NOT_CURRENTLY_PRIORITIZED: "NOT CURRENTLY PRIORITIZED",
};

export const DECISION_HEADLINES: Record<DecisionCategory, string> = {
  PRIORITY_FUNDING: "Strong evidence supports prioritizing this asset for financing.",
  CONDITIONAL_FUNDING: "Financing can be considered once the remaining operational conditions are cleared.",
  HOLD_FOR_REVIEW: "Financing potential exists, but unresolved evidence issues require attention.",
  NOT_CURRENTLY_PRIORITIZED: "This asset is not currently a priority for incremental capital allocation.",
};

export const READINESS_LABELS: Record<FundingReadinessBand, string> = {
  READY_NOW: "READY NOW",
  NEARLY_READY: "NEARLY READY",
  CONDITIONAL: "CONDITIONAL",
  NOT_READY: "NOT READY",
};

export const STRATEGY_ORDER: AllocationStrategy[] = [
  "BALANCED",
  "MAXIMIZE_SAFE_DEPLOYMENT",
  "LOWEST_RISK_FIRST",
  "HIGHEST_OPPORTUNITY_FIRST",
];

export const STRATEGY_COPY: Record<AllocationStrategy, { name: string; summary: string }> = {
  BALANCED: {
    name: "Balanced",
    summary: "Balances financing opportunity, readiness, and concentration.",
  },
  MAXIMIZE_SAFE_DEPLOYMENT: {
    name: "Maximize Safe Deployment",
    summary: "Deploys the highest amount of capital that still respects safe financing capacity.",
  },
  LOWEST_RISK_FIRST: {
    name: "Lowest Risk First",
    summary: "Prioritizes the lowest-risk, highest-readiness assets before stretching capacity.",
  },
  HIGHEST_OPPORTUNITY_FIRST: {
    name: "Highest Opportunity First",
    summary: "Allocates first to the strongest financing opportunity scores.",
  },
};

export const ALLOCATION_RULES = {
  balancedMaxShare: 0.28,
  conditionalAfterPriority: true,
  holdEligible: false,
  notPrioritizedEligible: false,
  lowestRiskConditionalMinReadiness: 62,
  highestOpportunityConditionalMinScore: 60,
} as const;

export const DEFAULT_AVAILABLE_CAPITAL = 10_000_000;
export const DEFAULT_ALLOCATION_STRATEGY: AllocationStrategy = "BALANCED";
