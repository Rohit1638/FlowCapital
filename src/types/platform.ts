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
  phone?: string;
}

import type { SimulationOverlay } from "@/types/simulation";

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
  decision_status?: string;
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
  simulation_overlay?: SimulationOverlay;
  marketplace?: MarketplaceContext;
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

export type OfferStatus =
  | "DRAFT"
  | "PENDING"
  | "ACCEPTED"
  | "WITHDRAWN"
  | "EXPIRED"
  | "REJECTED"
  | "WON"
  | "LOST";

export interface FinancingOffer {
  id: string;
  request_id: string;
  production_request_id?: string;
  lender_id: string;
  lender_name: string;
  offered_amount: number;
  interest_rate: number;
  tenor_days: number;
  instrument_type: string;
  conditions: string[];
  notes?: string;
  status: OfferStatus;
  valid_until?: string;
  created_at: string;
  updated_at: string;
  effective_cost_pct?: number;
  estimated_financing_cost_inr?: number;
  comparison_score?: number;
  comparison_rank?: number;
  comparison_rank_reason?: string;
}

export interface ManufacturerOffersResponse {
  request_id: string;
  request_code: string;
  status: string;
  requested_amount: number;
  offer_count: number;
  best_rate: number | null;
  highest_amount: number | null;
  recommended_offer_id: string | null;
  offers: FinancingOffer[];
}

export interface ExposureSnapshot {
  financing_request_id?: string;
  request_code?: string;
  maximum_safe_capacity: number;
  active_exposure: number;
  reserved_exposure: number;
  pending_exposure?: number;
  total_consumed_capacity: number;
  remaining_available_capacity: number;
  utilization_percentage: number;
  over_financing_amount: number;
  risk_status: string;
  exposure_by_lender?: Array<{ lender_id: string; active_and_reserved: number }>;
  capacity_reasons?: string[];
  funding_requirement?: number;
}

export interface MarketplaceContext {
  eligible?: boolean;
  can_submit_offer?: boolean;
  eligibility_status: string;
  eligibility_reason?: string;
  maximum_safe_financing?: number;
  maximum_safe_capacity?: number;
  remaining_available_capacity?: number;
  utilization_percentage?: number;
  capacity_reasons?: string[];
  over_financing_amount?: number;
  recommended_amount_min?: number;
  recommended_amount_max?: number;
  competing_offer_count?: number;
  competing_lender_count?: number;
  competition_label?: string;
  my_offer?: FinancingOffer | null;
  active_exposure?: number;
  reserved_exposure?: number;
  risk_status?: string;
  competition_exposure_note?: string;
  lender_profile?: {
    lender_name: string;
    risk_appetite: string;
    minimum_confidence_threshold: number;
    strategy_summary: string;
  };
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
  maximum_safe_financing?: number;
  outstanding_exposure: number;
  unclaimed_value: number;
  funding_readiness: string;
  open_conflicts: number;
  document_completeness_pct: number;
  recommended_min: number;
  recommended_max: number;
  recommended_instrument?: string;
  instrument_suitability_score?: number;
  instrument_lifecycle_stage?: string;
  lender_instrument_match?: boolean;
  instrument_policy_note?: string;
  eligibility_status: string;
  eligibility_reason?: string;
  eligible?: boolean;
  can_submit_offer?: boolean;
  remaining_available_capacity?: number;
  utilization_percentage?: number;
  competing_offer_count?: number;
  competing_lender_count?: number;
  competition_label?: string;
  has_pending_offer?: boolean;
  my_offer_id?: string | null;
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
  capital_capacity?: ExposureSnapshot | null;
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

export interface InstrumentSuitability {
  current_lifecycle_stage: string;
  lifecycle_display_name?: string;
  current_instrument: string;
  recommended_instrument: string;
  alternative_instruments?: Array<{ instrument: string; suitability_score: number; category: string }>;
  recommended_suitability_score: number;
  recommended_category?: string;
  transition_status: string;
  transition_recommended?: boolean;
  transition_reason?: string;
  blocking_reasons?: string[];
  pending_transition?: InstrumentTransitionSummary | null;
}

export interface InstrumentTransitionSummary {
  id: string;
  financing_request_id: string;
  financing_id?: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  request_code?: string;
  from_instrument: string;
  to_instrument: string;
  previous_lifecycle_stage: string;
  new_lifecycle_stage: string;
  transition_type: string;
  status: string;
  suitability_score: number;
  transition_reason: string;
  confidence_snapshot?: number;
  confidence_score?: number;
  risk_snapshot?: string;
  created_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_notes?: string | null;
}

export interface InstrumentTransitionDetail extends InstrumentTransitionSummary {
  request?: {
    request_code: string;
    project_name: string;
    manufacturer_name: string;
    confidence_score: number;
    risk_level: string;
    financeable_value: number;
    progress_pct: number;
  };
  exposure_snapshot?: ExposureSnapshot;
  assessment?: InstrumentSuitability;
  recommendation_reasons?: string[];
  deterministic_note?: string;
}

export interface FinancingLifecycleView {
  request_id: string;
  request_code: string;
  project_name: string;
  current_stage: string;
  current_stage_display: string;
  current_instrument?: string;
  recommended_instrument?: string;
  suitability_score?: number;
  transition_status: string;
  transition_reason?: string;
  pending_transition_id?: string | null;
  lifecycle_flow: Array<{ phase: string; stages: string[]; instrument: string }>;
  suitability?: InstrumentSuitability;
  transitions?: InstrumentTransitionSummary[];
}

export interface AIInsightResponse {
  content: string;
  fallback_used: boolean;
  provider: string;
}

export interface ReassessmentRecord {
  id: string;
  financing_request_id: string;
  request_code?: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  project_name?: string;
  product_name?: string;
  trigger_event_id: string;
  trigger_type: string;
  status: string;
  previous_confidence: number;
  new_confidence: number;
  confidence_change: number;
  previous_risk: string;
  new_risk: string;
  previous_financeable_value?: number;
  new_financeable_value?: number;
  previous_safe_capacity: number;
  new_safe_capacity: number;
  capacity_change: number;
  previous_active_exposure?: number;
  new_active_exposure?: number;
  previous_remaining_capacity: number;
  new_remaining_capacity: number;
  previous_instrument?: string | null;
  new_recommended_instrument?: string;
  instrument_transition_status?: string;
  impact_level: string;
  recommended_action: string;
  reason_summary: string;
  created_at?: string;
  lender_action?: string | null;
}

export interface ReassessmentDetail extends ReassessmentRecord {
  request?: { request_code: string; project_name: string; manufacturer_name: string; progress_pct: number };
  trigger_event?: Record<string, unknown>;
  ai_explanation_context?: Record<string, unknown>;
}

export interface FinancingHealth {
  request_id: string;
  request_code: string;
  confidence_score: number;
  risk_level: string;
  progress_pct: number;
  maximum_safe_capacity: number;
  active_exposure: number;
  remaining_capacity: number;
  utilization_percentage: number;
  last_reassessment?: ReassessmentRecord | null;
  recent_reassessments?: ReassessmentRecord[];
  next_recommended_action: string;
  last_change_summary?: string | null;
  impact_level: string;
}
