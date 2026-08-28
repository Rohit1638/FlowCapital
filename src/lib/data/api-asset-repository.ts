import type { Asset } from "@/types/asset";
import { getCloudAsset, listCloudAssets } from "@/lib/api/assets";
import { mapCloudAssets, cloudAssetToTwin } from "@/lib/data/mapper";
import type { AssetRepository } from "@/lib/data/types";

export class ApiAssetRepository implements AssetRepository {
  async getAssets(): Promise<Asset[]> {
    const response = await listCloudAssets();
    return mapCloudAssets(response.items);
  }

  async getAssetById(assetId: string): Promise<Asset | null> {
    const row = await getCloudAsset(assetId);
    return cloudAssetToTwin(row);
  }
}

export const apiAssetRepository = new ApiAssetRepository();
