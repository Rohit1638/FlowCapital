export interface CloudAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  asset_type: string;
  owner_name: string;
  description: string | null;
  quantity: number;
  unit: string;
  current_location: string | null;
  lifecycle_stage: string;
  status: string;
  metadata: { twin?: Record<string, unknown> } & Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; page_size: number; total: number };
}

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  timestamp: string;
}
