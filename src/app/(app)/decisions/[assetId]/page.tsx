import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetDecisionView } from "@/components/decisions/AssetDecisionView";
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
  return { title: `Financing Decision · ${assetId}` };
}

export default async function AssetDecisionPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  if (!getBaseAssetById(assetId)) notFound();
  return <AssetDecisionView assetId={assetId} />;
}
