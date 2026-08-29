export const SIMULATION_CONFIDENCE_BANDS = [
  { min: 80, max: 100, label: "HIGH CONFIDENCE", riskLevel: "HIGH_CONFIDENCE" },
  { min: 60, max: 79, label: "MODERATE CONFIDENCE", riskLevel: "MODERATE_CONFIDENCE" },
  { min: 40, max: 59, label: "ELEVATED RISK", riskLevel: "ELEVATED_RISK" },
  { min: 0, max: 39, label: "HIGH RISK", riskLevel: "HIGH_RISK" },
] as const;

export function bandLabelForConfidence(score: number): string {
  for (const band of SIMULATION_CONFIDENCE_BANDS) {
    if (score >= band.min && score <= band.max) return band.label;
  }
  return "HIGH RISK";
}

export function riskColorClass(riskLevel: string): string {
  if (riskLevel === "HIGH_RISK") return "text-red-600";
  if (riskLevel === "ELEVATED_RISK") return "text-amber-700";
  if (riskLevel === "MODERATE_CONFIDENCE") return "text-foreground/70";
  return "text-lime-deep";
}
