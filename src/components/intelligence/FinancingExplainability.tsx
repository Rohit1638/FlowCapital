"use client";

import type { FinancialAssessment } from "@/types/intelligence";
import { formatCurrencyINR, formatINRFull } from "@/lib/format";

export function FinancingExplainability({ assessment }: { assessment: FinancialAssessment }) {
  const rows = [
    ["Current realizable value", assessment.valuation.currentRealizableValue],
    ["Risk-adjusted value", assessment.valuation.riskAdjustedValue],
    ["Financing eligible value", assessment.valuation.financingEligibleValue],
    ["Maximum safe financing", assessment.financing.maximumSafeFinancing],
  ] as const;

  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Financing capacity</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        How was {formatCurrencyINR(assessment.financing.maximumSafeFinancing, 2)} calculated?
      </h2>
      <ol className="mt-5 space-y-3">
        {rows.map(([label, value], index) => (
          <li key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f4f4f0] px-4 py-3">
            <span className="text-sm">
              <span className="mr-2 text-[11px] uppercase tracking-wide text-ink/40">0{index + 1}</span>
              {label}
            </span>
            <span className="font-display text-lg font-semibold">{formatCurrencyINR(value, 2)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {formatCurrencyINR(assessment.valuation.currentRealizableValue, 2)} × {assessment.valuation.riskAdjustmentFactor.toFixed(2)} risk
        factor × {Math.round(assessment.valuation.dataConfidenceAdjustment * 100)}% confidence × {assessment.ltv.recommendedLTV}% LTV ={" "}
        {formatCurrencyINR(assessment.financing.maximumSafeFinancing, 2)} ({formatINRFull(assessment.financing.maximumSafeFinancing)}).
      </p>
      <p className="mt-3 text-xs uppercase tracking-wide text-ink/40">{assessment.financing.disclaimer}</p>
    </section>
  );
}
