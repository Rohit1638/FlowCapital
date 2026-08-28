import type { Asset } from "@/types/asset";

export interface AssetRepository {
  getAssets(): Promise<Asset[]>;
  getAssetById(assetId: string): Promise<Asset | null>;
}

export type ConnectionMode = "checking" | "cloud" | "demo";
