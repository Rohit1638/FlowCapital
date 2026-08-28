import type { FinancialAssessment, RiskFactor } from "@/types/intelligence";
import { formatCurrencyINR } from "@/lib/format";

export function explainRisk(score: number, factors: RiskFactor[]): {
  primaryDrivers: string[];
  positiveSignals: string[];
  explanation: string;
} {
  const increasing = factors.filter((item) => item.direction === "increases").sort((a, b) => b.score - a.score);
  const reducing = factors.filter((item) => item.direction === "reduces" || item.score <= 2);

  const primaryDrivers = increasing.slice(0, 3).map((item) => item.explanation);
  const positiveSignals = reducing.slice(0, 3).map((item) => item.explanation);

  return {
    primaryDrivers: primaryDrivers.length > 0 ? primaryDrivers : ["No material risk amplifiers on this twin."],
    positiveSignals: positiveSignals.length > 0 ? positiveSignals : ["Limited residual uncertainty after trusted evidence."],
    explanation: `Risk is ${score} / 100 because ${primaryDrivers[0] ?? "residual lifecycle uncertainty remains."} ${
      positiveSignals[0] ? `Offsetting this: ${positiveSignals[0]}` : ""
    }`,
  };
}

export function explainFinancing(assessment: FinancialAssessment): string {
  const { valuation, ltv, financing } = assessment;
  return [
    `${formatCurrencyINR(valuation.currentRealizableValue, 2)} current realizable value`,
    `× ${valuation.riskAdjustmentFactor.toFixed(2)} risk adjustment → ${formatCurrencyINR(valuation.riskAdjustedValue, 2)}`,
    `× ${Math.round(valuation.dataConfidenceAdjustment * 100)}% data confidence → ${formatCurrencyINR(valuation.financingEligibleValue, 2)} eligible`,
    `× ${ltv.recommendedLTV}% recommended LTV`,
    `= ${formatCurrencyINR(financing.maximumSafeFinancing, 2)} recommended financing capacity.`,
  ].join(" ");
}

export function explainValuation(assessment: FinancialAssessment): string {
  const { valuation } = assessment;
  return `Contractual value ${formatCurrencyINR(valuation.contractualValue, 2)} supports a current realizable value of ${formatCurrencyINR(
    valuation.currentRealizableValue,
    2,
  )} under the lifecycle band. This is a decision-support estimate, not a market mark.`;
}
