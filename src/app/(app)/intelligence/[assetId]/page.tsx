import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetFinancialIntelligence } from "@/components/intelligence/AssetDesk";
import { baseAssets, getBaseAssetById } from "@/lib/demo-data/assets";

export function generateStaticParams() {
  return baseAssets.map((asset) => ({ assetId: asset.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ assetId: string }>;
}): Promise<Metadata> {
  const { assetId } = await params;
  return { title: `Financial Intelligence · ${assetId}` };
}

export default async function AssetIntelligencePage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  if (!getBaseAssetById(assetId)) notFound();
  return <AssetFinancialIntelligence assetId={assetId} />;
}
