import type { Asset } from "@/types/asset";
import type { CloudAsset } from "@/lib/api/types";
import { getBaseAssetById } from "@/lib/demo-data/assets";

function isTwin(value: unknown): value is Asset {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.name === "string" && typeof row.physical === "object";
}

export function cloudAssetToTwin(row: CloudAsset): Asset | null {
  const fallback = getBaseAssetById(row.asset_code);
  const twin = row.metadata?.twin;
  if (isTwin(twin)) {
    return {
      ...twin,
      id: row.asset_code,
      availableAmount: twin.availableFinancing ?? twin.availableAmount,
      lastUpdated: row.updated_at,
    };
  }
  return fallback ?? null;
}

export function mapCloudAssets(rows: CloudAsset[]): Asset[] {
  return rows
    .map(cloudAssetToTwin)
    .filter((item): item is Asset => item !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}
