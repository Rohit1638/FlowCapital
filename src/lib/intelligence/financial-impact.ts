import type { FinancialAssessment, FinancialImpact } from "@/types/intelligence";
import { formatCurrencyINR } from "@/lib/format";

export function financialImpact(current: FinancialAssessment, simulated: FinancialAssessment): FinancialImpact {
  const valueDelta = simulated.valuation.currentRealizableValue - current.valuation.currentRealizableValue;
  const riskDelta = simulated.risk.overallScore - current.risk.overallScore;
  const ltvDelta = simulated.ltv.recommendedLTV - current.ltv.recommendedLTV;
  const financingDelta = simulated.financing.maximumSafeFinancing - current.financing.maximumSafeFinancing;

  const parts: string[] = [];
  if (valueDelta !== 0) {
    parts.push(`Realizable value ${valueDelta > 0 ? "increased" : "decreased"} by ${formatCurrencyINR(Math.abs(valueDelta), 2)}.`);
  }
  if (riskDelta !== 0) {
    parts.push(`Risk ${riskDelta < 0 ? "improved" : "worsened"} by ${Math.abs(riskDelta)} points.`);
  }
  if (ltvDelta !== 0) {
    parts.push(`Recommended LTV moved ${ltvDelta > 0 ? "+" : ""}${ltvDelta} pts.`);
  }
  if (financingDelta !== 0) {
    parts.push(
      `Recommended financing capacity ${financingDelta > 0 ? "increased" : "decreased"} by ${formatCurrencyINR(Math.abs(financingDelta), 2)}.`,
    );
  }

  return {
    valueDelta,
    riskDelta,
    ltvDelta,
    financingDelta,
    summary: parts.join(" ") || "No material financial change under this simulation.",
  };
}
