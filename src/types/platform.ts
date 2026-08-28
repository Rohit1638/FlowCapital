export type UserRole = "MANUFACTURER" | "LENDER";

export interface PlatformProfile {
  id: string;
  full_name: string;
  email: string;
  organization_name?: string;
  role: UserRole;
  company_name?: string;
  designation?: string;
  username?: string;
}

export interface ProductionRequest {
  id: string;
  request_code: string;
  manufacturer_id: string;
  manufacturer_name?: string;
  project_name: string;
  product_name: string;
  product_category: string;
  quantity: number;
  expected_selling_value: number;
  estimated_production_cost: number;
  required_funding_amount: number;
  funding_purpose?: string;
  expected_start_date?: string;
  expected_completion_date?: string;
  buyer_name?: string;
  purchase_order_reference?: string;
  description?: string;
  current_stage: string;
  progress_pct: number;
  status: string;
  confidence_score: number;
  risk_level: string;
  verified_value: number;
  financeable_value: number;
  outstanding_exposure: number;
  unclaimed_value: number;
  open_conflicts?: number;
  document_completeness_pct?: number;
  financing_recommendation?: FinancingRecommendation;
  stages?: ProductionStage[];
  collateral?: CollateralItem[];
  documents?: RequestDocument[];
  events?: WorkflowEvent[];
  conflicts?: ConflictItem[];
  decisions?: LenderDecision[];
  tranches?: FinancingTranche[];
  capital_forecast?: CapitalForecast;
}

export interface ProductionStage {
  id: string;
  stage_code: string;
  stage_name: string;
  sequence_order: number;
  progress_pct: number;
  status: string;
  estimated_duration_days?: number;
}

export interface CollateralItem {
  id: string;
  collateral_code: string;
  asset_name: string;
  asset_type: string;
  quantity: number;
  unit: string;
  estimated_value: number;
  lifecycle_stage: string;
  location?: string;
  already_pledged?: boolean;
  existing_financing_amount?: number;
}

export interface RequestDocument {
  id: string;
  document_name: string;
  document_type: string;
  verification_status: string;
  status: string;
  file_size_bytes?: number;
  mime_type?: string;
  storage_path?: string;
  uploaded_at?: string;
}

export interface WorkflowEvent {
  event_code: string;
  event_type: string;
  description: string;
  severity: string;
  timestamp: string;
  reassessment?: ReassessmentResult;
}

export interface ConflictItem {
  conflict_code: string;
  conflict_type: string;
  severity: string;
  status: string;
  description: string;
  expected_value?: string;
  actual_value?: string;
}

export interface LenderDecision {
  id: string;
  lender_id: string;
  lender_name?: string;
  decision_type: string;
  requested_amount: number;
  approved_amount: number;
  instrument?: string;
  reason?: string;
  conditions?: string[];
  decided_at?: string;
}

export interface FinancingTranche {
  id: string;
  tranche_code: string;
  approved_amount: number;
  outstanding_amount: number;
  instrument: string;
  status: string;
}

export interface FinancingRecommendation {
  requested_amount: number;
  verified_value: number;
  financeable_value: number;
  outstanding_exposure: number;
  unclaimed_value: number;
  confidence_score: number;
  risk_level: string;
  recommended_min: number;
  recommended_max: number;
  maximum_safe: number;
  confidence_band: string;
  reason: string;
  required_conditions: string[];
  eligibility_status: string;
}

export interface CapitalForecast {
  estimated_amount: number;
  estimated_days: number;
  label: string;
  summary?: string;
}

export interface ReassessmentResult {
  recommended_action: string;
  confidence_before: number;
  confidence_after: number;
  financeable_value_before: number;
  financeable_value_after: number;
  unclaimed_value: number;
  reason: string;
}

export interface OpportunitySummary {
  id: string;
  request_code: string;
  manufacturer_name: string;
  project_name: string;
  product_name: string;
  quantity: number;
  current_stage: string;
  requested_funding: number;
  verified_value: number;
  confidence_score: number;
  risk_level: string;
  financeable_value: number;
  outstanding_exposure: number;
  unclaimed_value: number;
  funding_readiness: string;
  open_conflicts: number;
  document_completeness_pct: number;
  recommended_min: number;
  recommended_max: number;
  eligibility_status: string;
  status: string;
}

export interface ManufacturerDashboard {
  active_production_requests: number;
  total_funding_requested: number;
  approved_financing: number;
  available_financing_capacity: number;
  capital_blocked: number;
  average_confidence_score: number;
  open_risks: number;
  open_conflicts: number;
  production_progress_pct: number;
  upcoming_funding_needs: CapitalForecast[];
  requests: ProductionRequest[];
}

export interface LenderDashboard {
  available_opportunities: number;
  requests_under_review: number;
  total_active_exposure: number;
  total_approved_financing: number;
  average_portfolio_confidence: number;
  high_risk_exposures: number;
  assets_requiring_attention: number;
  top_up_opportunities: number;
  step_down_risks: number;
  blocked_opportunities: number;
  opportunities: OpportunitySummary[];
}

export interface PlatformNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  read: boolean;
  created_at: string;
}

export interface AIInsightResponse {
  content: string;
  fallback_used: boolean;
  provider: string;
}
