export const RISK_ALERT_CONFIDENCE_THRESHOLD = 35;

export function isRiskAlert(confidenceScore: number): boolean {
  return confidenceScore < RISK_ALERT_CONFIDENCE_THRESHOLD;
}
