import type { Asset } from "@/types/asset";
import type { ConfidenceLevel, IntegrationEvent, ReconciliationFinding } from "@/types/integration";
import { SOURCE_RELIABILITY } from "@/lib/integration/connectors";

export function scoreConfidence(
  event: IntegrationEvent,
  asset: Asset | undefined,
  findings: ReconciliationFinding[],
): { score: number; level: ConfidenceLevel } {
  let score = SOURCE_RELIABILITY[event.source];

  const payloadKeys = Object.keys(event.payload);
  const filled = payloadKeys.filter((key) => event.payload[key] !== null && event.payload[key] !== undefined);
  if (filled.length < 2) score -= 5;

  if (asset?.physical.verificationStatus === "VERIFIED") score += 2;
  if (asset?.physical.verificationStatus === "MISMATCH") score -= 8;

  const ageHours = Math.abs(Date.now() - new Date(event.timestamp).getTime()) / 3_600_000;
  if (ageHours > 72) score -= 6;
  else if (ageHours < 1) score += 1;

  if (findings.some((item) => item.status === "CONFLICT")) score -= 30;
  if (findings.some((item) => item.status === "INVALID_EVENT_ORDER")) score -= 25;
  if (findings.some((item) => item.status === "VALID_UPDATE")) score += 2;

  score = Math.max(0, Math.min(99, Math.round(score)));
  const level: ConfidenceLevel = score >= 85 ? "HIGH" : score >= 65 ? "MEDIUM" : "LOW";
  return { score, level };
}
