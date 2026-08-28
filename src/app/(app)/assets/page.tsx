import type { Metadata } from "next";
import { AssetIntelligence } from "@/components/assets/AssetIntelligence";

export const metadata: Metadata = {
  title: "Asset Intelligence",
};

export default function AssetsPage() {
  return <AssetIntelligence />;
}
