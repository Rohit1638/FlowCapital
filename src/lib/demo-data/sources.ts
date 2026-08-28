import type { DataSource } from "@/types/asset";
import { PRIMARY_ASSET_ID } from "@/lib/demo-data/assets";

export const dataSources: DataSource[] = [
  {
    id: "001-s-po",
    assetId: PRIMARY_ASSET_ID,
    name: "Purchase Order System",
    status: "VERIFIED",
    confidence: 98,
    applicable: true,
  },
  {
    id: "001-s-erp",
    assetId: PRIMARY_ASSET_ID,
    name: "ERP / Production System",
    status: "VERIFIED",
    confidence: 94,
    applicable: true,
  },
  {
    id: "001-s-wh",
    assetId: PRIMARY_ASSET_ID,
    name: "Warehouse Records",
    status: "PENDING_SYNC",
    confidence: 82,
    applicable: true,
  },
  {
    id: "001-s-log",
    assetId: PRIMARY_ASSET_ID,
    name: "Logistics",
    status: "NOT_APPLICABLE",
    confidence: 0,
    applicable: false,
  },
  {
    id: "002-s-log",
    assetId: "DA-2026-002",
    name: "Logistics",
    status: "VERIFIED",
    confidence: 96,
    applicable: true,
  },
  {
    id: "002-s-erp",
    assetId: "DA-2026-002",
    name: "ERP / Production System",
    status: "VERIFIED",
    confidence: 91,
    applicable: true,
  },
  {
    id: "003-s-wh",
    assetId: "DA-2026-003",
    name: "Warehouse Records",
    status: "MISMATCH",
    confidence: 61,
    applicable: true,
  },
  {
    id: "003-s-erp",
    assetId: "DA-2026-003",
    name: "ERP / Production System",
    status: "VERIFIED",
    confidence: 88,
    applicable: true,
  },
  {
    id: "004-s-po",
    assetId: "DA-2026-004",
    name: "Purchase Order System",
    status: "VERIFIED",
    confidence: 99,
    applicable: true,
  },
  {
    id: "004-s-log",
    assetId: "DA-2026-004",
    name: "Logistics",
    status: "NOT_APPLICABLE",
    confidence: 0,
    applicable: false,
  },
  {
    id: "007-s-bill",
    assetId: "DA-2026-007",
    name: "ERP / Billing",
    status: "VERIFIED",
    confidence: 97,
    applicable: true,
  },
  {
    id: "008-s-bank",
    assetId: "DA-2026-008",
    name: "Bank / Collections",
    status: "VERIFIED",
    confidence: 99,
    applicable: true,
  },
];

export function getSourcesForAsset(assetId: string): DataSource[] {
  const owned = dataSources.filter((item) => item.assetId === assetId);
  if (owned.length > 0) return owned;
  return [
    {
      id: `${assetId}-s-erp`,
      assetId,
      name: "ERP / Production System",
      status: "VERIFIED",
      confidence: 90,
      applicable: true,
    },
    {
      id: `${assetId}-s-po`,
      assetId,
      name: "Purchase Order System",
      status: "VERIFIED",
      confidence: 93,
      applicable: true,
    },
  ];
}
