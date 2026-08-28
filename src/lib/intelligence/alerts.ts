import type { IntelligenceContext, RiskAlert, RiskFactor } from "@/types/intelligence";
import { DEMO_AS_OF } from "@/lib/demo-data/valuation-config";

export function buildRiskAlerts(assetId: string, ctx: IntelligenceContext, factors: RiskFactor[]): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const conflict = factors.find((item) => item.id === "conflict");
  if (ctx.hasMismatch || ctx.openHighConflicts > 0) {
    alerts.push({
      id: `${assetId}-alert-conflict`,
      assetId,
      severity: "HIGH",
      title: "High severity conflict",
      description:
        assetId === "DA-2026-003"
          ? "60-unit mismatch between production and warehouse records."
          : "Unresolved physical-data conflict on this twin.",
      riskImpact: conflict?.score ?? 18,
      status: "ACTIVE",
      createdAt: DEMO_AS_OF,
    });
  }
  const freshness = factors.find((item) => item.id === "freshness");
  if ((freshness?.score ?? 0) >= 3) {
    alerts.push({
      id: `${assetId}-alert-stale`,
      assetId,
      severity: "MEDIUM",
      title: "Stale data",
      description: "No trusted asset event received in the configured freshness window.",
      riskImpact: freshness?.score ?? 3,
      status: "ACTIVE",
      createdAt: DEMO_AS_OF,
    });
  }
  if (ctx.verificationStatus === "PENDING_SYNC" && ["PRODUCTION", "FINISHED_GOODS", "WAREHOUSE", "INVOICE"].includes(ctx.stage)) {
    alerts.push({
      id: `${assetId}-alert-verify`,
      assetId,
      severity: "MEDIUM",
      title: "Low verification",
      description: "Asset has reached a financially significant stage without complete verification.",
      riskImpact: 6,
      status: "ACTIVE",
      createdAt: DEMO_AS_OF,
    });
  }
  if (ctx.logistics === "DELAYED" || ctx.logistics === "SEVERELY_DELAYED") {
    alerts.push({
      id: `${assetId}-alert-logistics`,
      assetId,
      severity: ctx.logistics === "SEVERELY_DELAYED" ? "HIGH" : "MEDIUM",
      title: "Logistics delay",
      description: "Shipment delay is increasing operational uncertainty.",
      riskImpact: ctx.logistics === "SEVERELY_DELAYED" ? 10 : 6,
      status: "ACTIVE",
      createdAt: DEMO_AS_OF,
    });
  }
  if (ctx.financial === "PAYMENT_DELAYED") {
    alerts.push({
      id: `${assetId}-alert-payment`,
      assetId,
      severity: "HIGH",
      title: "Payment delay",
      description: "Payment has exceeded the expected collection window.",
      riskImpact: 5,
      status: "ACTIVE",
      createdAt: DEMO_AS_OF,
    });
  }
  return alerts;
}
