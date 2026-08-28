import { apiFetch } from "@/lib/api/client";
import type { CloudAsset, Paginated } from "@/lib/api/types";

export function listCloudAssets() {
  return apiFetch<Paginated<CloudAsset>>("/assets?page=1&page_size=100");
}

export function getCloudAsset(assetId: string) {
  return apiFetch<CloudAsset>(`/assets/${encodeURIComponent(assetId)}`);
}
