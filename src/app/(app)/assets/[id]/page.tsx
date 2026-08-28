import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetPassport } from "@/components/assets/AssetPassport";
import { baseAssets, getBaseAssetById } from "@/lib/demo-data/assets";

export function generateStaticParams() {
  return baseAssets.map((asset) => ({ id: asset.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const asset = getBaseAssetById(id);
  return {
    title: asset ? `${asset.id}` : "Asset",
  };
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getBaseAssetById(id)) {
    notFound();
  }

  return <AssetPassport assetId={id} />;
}
