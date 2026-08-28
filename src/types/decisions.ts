import type { LifecycleStage, VerificationStatus } from "./asset";
import type { IntelligenceRiskLevel, RiskTrendDirection } from "./intelligence";

export type DecisionCategory =
  | "PRIORITY_FUNDING"
  | "CONDITIONAL_FUNDING"
  | "HOLD_FOR_REVIEW"
  | "NOT_CURRENTLY_PRIORITIZED";

export type FundingReadinessBand = "READY_NOW" | "NEARLY_READY" | "CONDITIONAL" | "NOT_READY";

export type OpportunityFactorId =
  | "capacity"
  | "risk"
  | "confidence"
  | "verification"
  | "conflict"
  | "maturity"
  | "efficiency";

export type ActionPriority = "HIGH" | "MEDIUM" | "LOW";

export type AllocationStrategy =
  | "BALANCED"
  | "MAXIMIZE_SAFE_DEPLOYMENT"
  | "LOWEST_RISK_FIRST"
  | "HIGHEST_OPPORTUNITY_FIRST";

export type DecisionSignalKind = "supporting" | "blocking";

export interface OpportunityFactor {
  id: OpportunityFactorId;
  label: string;
  weight: number;
  points: number;
  max: number;
  explanation: string;
}

export interface FinancingOpportunityScore {
  assetId: string;
  score: number;
  factors: OpportunityFactor[];
  summary: string;
}

export interface FundingReadiness {
  assetId: string;
  score: number;
  band: FundingReadinessBand;
  components: { id: string; label: string; points: number; max: number; explanation: string }[];
  summary: string;
}

export interface FundingRecommendation {
  assetId: string;
  category: DecisionCategory;
  label: string;
  headline: string;
  conditions: string[];
  reviewItems: string[];
  primaryReason: string;
}

export interface PriorityRanking {
  assetId: string;
  rank: number;
  opportunityScore: number;
  readinessScore: number;
  riskLevel: IntelligenceRiskLevel;
  maximumSafeFinancing: number;
  category: DecisionCategory;
  primaryReason: string;
}

export interface DecisionSignal {
  id: string;
  kind: DecisionSignalKind;
  text: string;
}

export interface DecisionExplanation {
  assetId: string;
  category: DecisionCategory;
  why: string;
  supporting: DecisionSignal[];
  blocking: DecisionSignal[];
  primaryAction: string;
}

export interface RecommendedAction {
  id: string;
  assetId: string;
  priority: ActionPriority;
  action: string;
  whyItMatters: string;
  expectedImpact: string;
  potentialCapitalDelta: number;
}

export interface CapitalUnlockOpportunity {
  assetId: string;
  hasUnlock: boolean;
  currentFinancingCapacity: number;
  currentCategory: DecisionCategory;
  primaryBlocker: string;
  recommendedAction: string;
  potentialFinancingCapacity: number;
  additionalCapitalUnlockable: number;
  potentialCategory: DecisionCategory;
  simulationNote: string;
}

export interface AssetDecisionRecord {
  assetId: string;
  assetName: string;
  stage: LifecycleStage;
  verificationStatus: VerificationStatus;
  opportunity: FinancingOpportunityScore;
  readiness: FundingReadiness;
  recommendation: FundingRecommendation;
  ranking: PriorityRanking;
  explanation: DecisionExplanation;
  actions: RecommendedAction[];
  unlock: CapitalUnlockOpportunity;
  currentRealizableValue: number;
  riskScore: number;
  riskLevel: IntelligenceRiskLevel;
  riskTrend: RiskTrendDirection;
  recommendedLTV: number;
  maximumSafeFinancing: number;
  dataConfidence: number;
}

export interface PortfolioDecisionSummary {
  totalSafeFinancing: number;
  priorityFundingPotential: number;
  conditionalCapital: number;
  blockedCapital: number;
  assetsReadyNow: number;
  assetsRequiringAttention: number;
  priorityCount: number;
  conditionalCount: number;
  holdCount: number;
  notPrioritizedCount: number;
  highestPriorityAction: string;
  topAssetId: string | null;
}

export interface CapitalAllocationInput {
  availableCapital: number;
  strategy: AllocationStrategy;
  includeConditional?: boolean;
}

export interface AllocationItem {
  assetId: string;
  assetName: string;
  category: DecisionCategory;
  recommendedCapacity: number;
  allocated: number;
  opportunityScore: number;
  readinessScore: number;
  riskLevel: IntelligenceRiskLevel;
  reason: string;
}

export interface CapitalAllocationResult {
  strategy: AllocationStrategy;
  availableCapital: number;
  allocatedCapital: number;
  unallocatedCapital: number;
  assetsFunded: number;
  averagePortfolioRisk: number;
  averageRiskLevel: IntelligenceRiskLevel;
  capitalConcentration: number;
  items: AllocationItem[];
  unusedReason: string;
  executiveSummary: string;
}

export interface AllocationComparisonRow {
  strategy: AllocationStrategy;
  assetsFunded: number;
  capitalDeployed: number;
  unallocatedCapital: number;
  averageRiskLevel: IntelligenceRiskLevel;
  concentration: number;
}

export interface AllocationWhatIfResult {
  current: CapitalAllocationResult;
  improved: CapitalAllocationResult;
  additionalDeployable: number;
  highlight: string;
  unlockHighlights: { assetId: string; additionalCapital: number; from: DecisionCategory; to: DecisionCategory }[];
}
