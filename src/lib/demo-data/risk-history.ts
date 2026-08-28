import type { RiskSnapshot } from "@/types/risk";
import { getRiskLabel } from "@/lib/lifecycle";
import { PRIMARY_ASSET_ID } from "@/lib/demo-data/assets";

export const riskHistory: RiskSnapshot[] = [
  {
    id: "001-r1",
    assetId: PRIMARY_ASSET_ID,
    score: 22,
    level: "LOW",
    reason: "Verified PO and clean supplier record at origination.",
    timestamp: "2026-08-16T08:40:00.000Z",
  },
  {
    id: "001-r2",
    assetId: PRIMARY_ASSET_ID,
    score: 26,
    level: "LOW",
    reason: "Procurement in flight. Exposure still inside policy.",
    timestamp: "2026-08-18T12:00:00.000Z",
  },
  {
    id: "001-r3",
    assetId: PRIMARY_ASSET_ID,
    score: 34,
    level: "LOW",
    reason: "Production start increased WIP concentration.",
    timestamp: "2026-08-24T06:00:00.000Z",
  },
  {
    id: "001-r4",
    assetId: PRIMARY_ASSET_ID,
    score: 42,
    level: "MEDIUM",
    reason: "Raw-material delivery delay increased production timeline uncertainty.",
    timestamp: "2026-08-27T09:10:00.000Z",
  },
  {
    id: "002-r1",
    assetId: "DA-2026-002",
    score: 24,
    level: "LOW",
    reason: "On-schedule line-haul with verified CFS gate-out.",
    timestamp: "2026-08-28T06:40:00.000Z",
  },
  {
    id: "003-r1",
    assetId: "DA-2026-003",
    score: 48,
    level: "MEDIUM",
    reason: "Warehouse receipt posted with full production quantity.",
    timestamp: "2026-08-26T12:20:00.000Z",
  },
  {
    id: "003-r2",
    assetId: "DA-2026-003",
    score: 76,
    level: "HIGH",
    reason: "Quantity mismatch between production close and warehouse count.",
    timestamp: "2026-08-28T05:10:00.000Z",
  },
  {
    id: "007-r1",
    assetId: "DA-2026-007",
    score: 45,
    level: getRiskLabel(45),
    reason: "Open receivable with 31 days to expected cash.",
    timestamp: "2026-08-27T09:15:00.000Z",
  },
];

export function getRiskHistoryForAsset(assetId: string): RiskSnapshot[] {
  return riskHistory
    .filter((item) => item.assetId === assetId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
