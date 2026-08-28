import { apiFetch } from "@/lib/api/client";

export function listCloudVerifications(assetId?: string) {
  const query = assetId ? `?asset_id=${encodeURIComponent(assetId)}` : "";
  return apiFetch(`/verifications${query}`);
}
