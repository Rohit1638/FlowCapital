"use client";

import type { FinancialAssessment } from "@/types/intelligence";
import { formatCurrencyINR } from "@/lib/format";

export function ValuationBreakdown({ assessment }: { assessment: FinancialAssessment }) {
  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Valuation</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">How this value was determined</h2>
      <ol className="mt-5 space-y-3">
        {assessment.valuation.steps.map((step, index) => (
          <li key={step.label} className="rounded-2xl bg-[#f4f4f0] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-ink/40">0{index + 1}</p>
                <p className="mt-1 font-medium">{step.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.note}</p>
              </div>
              <p className="font-display text-xl font-semibold">{formatCurrencyINR(step.value, 2)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">{assessment.valuation.methodologyNote}</p>
    </section>
  );
}
