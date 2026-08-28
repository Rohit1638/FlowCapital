import { apiFetch } from "@/lib/api/client";

export function listCloudConflicts(assetId?: string) {
  const query = assetId ? `?asset_id=${encodeURIComponent(assetId)}` : "";
  return apiFetch(`/conflicts${query}`);
}

export function resolveCloudConflict(conflictId: string, resolution_notes: string) {
  return apiFetch(`/conflicts/${conflictId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ resolution_notes }),
  });
}
