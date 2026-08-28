import type { LifecycleStage, RiskLevel, VerificationStatus } from "./asset";
import type { ConfidenceLevel } from "./integration";

export type IntelligenceRiskLevel = Exclude<RiskLevel, "CLOSED"> | "CLOSED";

export type RiskTrendDirection = "IMPROVING" | "STABLE" | "WORSENING";

export type RiskFactorId =
  | "lifecycle"
  | "dataConfidence"
  | "verification"
  | "conflict"
  | "operational"
  | "freshness"
  | "logistics"
  | "financial";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export type SimulatorVerification = "PENDING" | "PARTIALLY_VERIFIED" | "VERIFIED";
export type SimulatorConflictSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH";
export type SimulatorLogistics = "NORMAL" | "DELAYED" | "SEVERELY_DELAYED";
export type SimulatorFinancial = "NORMAL" | "PAYMENT_DELAYED" | "PAYMENT_RECEIVED";

export interface ValuationStep {
  label: string;
  value: number;
  note: string;
}

export interface AssetValuation {
  assetId: string;
  contractualValue: number;
  currentRealizableValue: number;
  riskAdjustedValue: number;
  financingEligibleValue: number;
  riskAdjustmentFactor: number;
  dataConfidenceAdjustment: number;
  previousRealizableValue: number | null;
  realizableDelta: number;
  steps: ValuationStep[];
  methodologyNote: string;
}

export interface RiskFactor {
  id: RiskFactorId;
  label: string;
  score: number;
  max: number;
  applicable: boolean;
  applicability: number;
  explanation: string;
  direction: "increases" | "reduces" | "neutral";
}

export interface RiskAlert {
  id: string;
  assetId: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  riskImpact: number;
  status: AlertStatus;
  createdAt: string;
}

export interface RiskAssessment {
  assetId: string;
  overallScore: number;
  riskLevel: IntelligenceRiskLevel;
  factors: RiskFactor[];
  trend: RiskTrendDirection;
  trendDelta: number;
  previousScore: number | null;
  primaryDrivers: string[];
  positiveSignals: string[];
  alerts: RiskAlert[];
  explanation: string;
  dataConfidence: number;
  confidenceLevel: ConfidenceLevel;
}

export interface LtvAdjustment {
  id: string;
  label: string;
  deltaPct: number;
}

export interface LTVRecommendation {
  assetId: string;
  baseLTV: number;
  adjustments: LtvAdjustment[];
  recommendedLTV: number;
  explanation: string;
}

export interface FinancingCapacity {
  assetId: string;
  currentRealizableValue: number;
  riskAdjustedValue: number;
  financingEligibleValue: number;
  recommendedLTV: number;
  maximumSafeFinancing: number;
  alreadyFinanced: number;
  unusedCapacity: number;
  label: "RECOMMENDED FINANCING CAPACITY";
  disclaimer: string;
}

export interface FinancialImpact {
  valueDelta: number;
  riskDelta: number;
  ltvDelta: number;
  financingDelta: number;
  summary: string;
}

export interface FinancialAssessment {
  assetId: string;
  asOf: string;
  valuation: AssetValuation;
  risk: RiskAssessment;
  ltv: LTVRecommendation;
  financing: FinancingCapacity;
  simulated: boolean;
}

export interface SimulationInput {
  productionCompletion?: number;
  verificationStatus?: SimulatorVerification;
  dataConfidence?: number;
  openConflictCount?: number;
  conflictSeverity?: SimulatorConflictSeverity;
  logisticsStatus?: SimulatorLogistics;
  financialStatus?: SimulatorFinancial;
}

export interface SimulationResult {
  current: FinancialAssessment;
  simulated: FinancialAssessment;
  impact: FinancialImpact;
  explanation: string;
}

export interface FinancialScenario {
  id: string;
  name: string;
  assetId: string;
  summary: string;
  input: SimulationInput;
}

export interface IntelligenceContext {
  verificationStatus: VerificationStatus;
  productionCompletion: number;
  stage: LifecycleStage;
  dataConfidence: number;
  openHighConflicts: number;
  openConflicts: number;
  hasMismatch: boolean;
  logistics: SimulatorLogistics;
  financial: SimulatorFinancial;
  lastEventAt: string | null;
  hasAppliedQualityVerification: boolean;
  hasAppliedFinishedGoods: boolean;
  attention: boolean;
}
