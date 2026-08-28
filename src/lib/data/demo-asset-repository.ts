import type { Asset } from "@/types/asset";
import { baseAssets, getBaseAssetById } from "@/lib/demo-data/assets";
import type { AssetRepository } from "@/lib/data/types";

export class DemoAssetRepository implements AssetRepository {
  async getAssets(): Promise<Asset[]> {
    return baseAssets;
  }

  async getAssetById(assetId: string): Promise<Asset | null> {
    return getBaseAssetById(assetId) ?? null;
  }
}

export const demoAssetRepository = new DemoAssetRepository();
