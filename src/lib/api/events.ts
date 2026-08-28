import { apiFetch } from "@/lib/api/client";

export function ingestCloudEvent(body: Record<string, unknown>) {
  return apiFetch("/events", { method: "POST", body: JSON.stringify(body) });
}

export function listCloudEvents(assetId?: string) {
  const query = assetId ? `?asset_id=${encodeURIComponent(assetId)}` : "";
  return apiFetch(`/events${query}`);
}
