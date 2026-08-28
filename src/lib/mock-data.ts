import type { AIInsight } from "@/types/financing";
import { STAGE_LABELS, STAGE_SHORT_LABELS } from "@/lib/lifecycle";
import { baseAssets, getBaseAssetById, PRIMARY_ASSET_ID } from "@/lib/demo-data/assets";
import { baseEvents } from "@/lib/demo-data/events";
import { baseFinancingRecords } from "@/lib/demo-data/financing";
import { riskHistory } from "@/lib/demo-data/risk-history";
import {
  deriveCapitalOverview,
  deriveFinancialMovement,
  deriveLifecycleAggregates,
  derivePortfolioRisk,
} from "@/lib/selectors";

export { STAGE_LABELS, STAGE_SHORT_LABELS };
export { PRIMARY_ASSET_ID };

export const assets = baseAssets;
export const events = baseEvents
  .slice()
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  .slice(0, 6);
export const financingRecords = baseFinancingRecords;
export const riskProfiles = riskHistory;

export const capitalOverview = deriveCapitalOverview(baseAssets);
export const financialMovement = deriveFinancialMovement(baseAssets);
export const portfolioRisk = derivePortfolioRisk(baseAssets);

export const featuredInsight: AIInsight = {
  id: "insight-001",
  heading: "AI Decision Insight",
  recommendation: "Transition DA-2026-002 to In-Transit Financing",
  confidence: 94,
  reasoning:
    "Shipment verification is complete, the asset value is stable, and current exposure remains below the approved limit.",
  assetId: "DA-2026-002",
  suggestedInstrument: "IN_TRANSIT_FINANCING",
};

export function getLifecycleAggregates() {
  return deriveLifecycleAggregates(baseAssets);
}

export function getAssetById(id: string) {
  return getBaseAssetById(id);
}

export const currentUser = {
  name: "Ananya Rao",
  role: "Capital Desk",
  initials: "AR",
};
