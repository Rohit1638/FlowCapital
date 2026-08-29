export type SimulationStatus = "READY" | "RUNNING" | "PAUSED" | "COMPLETED";
export type SimulationMode = "MANUAL" | "AUTO";

export interface SimulationFinancialImpact {
  summary: string;
  exposure_change: number;
  completion_shift_days: number;
}

export interface SimulationEvent {
  id: string;
  simulation_id: string;
  request_id: string;
  stage: string;
  event_type: string;
  timestamp: string;
  description: string;
  severity: string;
  confidence_before: number;
  confidence_after: number;
  confidence_delta: number;
  confidence_factors?: string[];
  risk_level: string;
  production_progress: number;
  quantity_completed: number;
  quantity_planned: number;
  delay_days: number;
  financial_impact: SimulationFinancialImpact;
  generated_by: string;
}

export interface SimulationAlert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  status: string;
}

export interface SimulationState {
  simulation_id: string;
  request_id: string;
  request_code: string;
  manufacturer_name: string;
  product_name: string;
  project_name: string;
  status: SimulationStatus;
  mode: SimulationMode;
  current_stage: string;
  stage_index: number;
  confidence_score: number;
  starting_confidence: number;
  risk_level: string;
  risk_band_label: string;
  production_progress: number;
  quantity_planned: number;
  quantity_completed: number;
  delay_days: number;
  expected_completion_days: number;
  funding_requested: number;
  collateral_value: number;
  collateral_coverage_pct: number;
  financing_exposure: number;
  starting_exposure: number;
  events: SimulationEvent[];
  confidence_history: { stage: string; confidence: number }[];
  alerts: SimulationAlert[];
  ai_insight: string | null;
  latest_event: SimulationEvent | null;
  processing: boolean;
  risk_events_count: number;
  critical_events_count: number;
  started_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  generated_by: string;
}

export interface SimulationOverlay {
  active: boolean;
  simulation_id: string;
  status: SimulationStatus;
  current_stage: string;
  confidence_score: number;
  risk_level: string;
  production_progress: number;
  financing_exposure: number;
  latest_event?: SimulationEvent;
  ai_insight?: string;
}
