import type { Asset } from "@/types/asset";
import type { ConflictRecord, IntegrationEvent } from "@/types/integration";
import type { DataSource } from "@/types/asset";
import type { IntelligenceContext, SimulatorFinancial, SimulatorLogistics } from "@/types/intelligence";
import { DEMO_AS_OF } from "@/lib/demo-data/valuation-config";

function averageConfidence(sources: DataSource[], fallback: number): number {
  const applicable = sources.filter((item) => item.applicable && item.confidence > 0);
  if (applicable.length === 0) return fallback;
  return Math.round(applicable.reduce((sum, item) => sum + item.confidence, 0) / applicable.length);
}

function applied(events: IntegrationEvent[], assetId: string): IntegrationEvent[] {
  return events.filter((event) => event.assetId === assetId && event.status === "APPLIED");
}

export function eventDataConfidence(events: IntegrationEvent[], sources: DataSource[], assetId: string): number {
  const trusted = applied(events, assetId);
  if (trusted.length > 0) {
    const avg = trusted.reduce((sum, event) => sum + event.confidence, 0) / trusted.length;
    return Math.round(avg);
  }
  return averageConfidence(sources, 90);
}

export function detectLogistics(asset: Asset, events: IntegrationEvent[]): SimulatorLogistics {
  const delay = events.find(
    (event) =>
      event.assetId === asset.id &&
      event.status === "APPLIED" &&
      event.eventType === "SHIPMENT_DELAY_DETECTED" &&
      (event.severity === "warning" || event.severity === "critical" || (typeof event.payload.delayHours === "number" && event.payload.delayHours > 0)),
  );
  if (delay) {
    const hours = typeof delay.payload.delayHours === "number" ? delay.payload.delayHours : 12;
    return hours >= 48 ? "SEVERELY_DELAYED" : "DELAYED";
  }
  if (asset.physical.shipmentStatus?.toLowerCase().includes("delay")) return "DELAYED";
  return "NORMAL";
}

export function detectFinancial(asset: Asset, events: IntegrationEvent[]): SimulatorFinancial {
  const relevant = events.filter((event) => event.assetId === asset.id && event.status === "APPLIED");
  if (relevant.some((event) => event.eventType === "PAYMENT_RECEIVED")) return "PAYMENT_RECEIVED";
  if (relevant.some((event) => event.eventType === "PAYMENT_DELAY_DETECTED")) return "PAYMENT_DELAYED";
  return "NORMAL";
}

export function lastTrustedEventAt(events: IntegrationEvent[], assetId: string, fallback: string): string | null {
  const trusted = applied(events, assetId);
  if (trusted.length === 0) return fallback;
  return trusted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp ?? fallback;
}

export function buildIntelligenceContext(
  asset: Asset,
  events: IntegrationEvent[],
  conflicts: ConflictRecord[],
  sources: DataSource[],
): IntelligenceContext {
  const open = conflicts.filter((item) => item.assetId === asset.id && (item.status === "OPEN" || item.status === "UNDER_REVIEW"));
  const high = open.filter((item) => item.severity === "HIGH");
  const trusted = applied(events, asset.id);

  return {
    verificationStatus: asset.physical.verificationStatus,
    productionCompletion: asset.physical.productionCompletion,
    stage: asset.currentStage,
    dataConfidence: eventDataConfidence(events, sources, asset.id),
    openHighConflicts: high.length,
    openConflicts: open.length,
    hasMismatch: asset.physical.verificationStatus === "MISMATCH" || high.length > 0,
    logistics: detectLogistics(asset, events),
    financial: detectFinancial(asset, events),
    lastEventAt: lastTrustedEventAt(events, asset.id, asset.lastUpdated),
    hasAppliedQualityVerification: trusted.some(
      (event) => event.eventType === "QUALITY_VERIFIED" || event.eventType === "QUALITY_CHECK_COMPLETED",
    ),
    hasAppliedFinishedGoods: trusted.some((event) => event.eventType === "FINISHED_GOODS_CONFIRMED") || asset.currentStage === "FINISHED_GOODS",
    attention: Boolean(asset.attention),
  };
}

export { DEMO_AS_OF };
