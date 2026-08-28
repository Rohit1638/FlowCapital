"use client";

import type { RiskFactor } from "@/types/intelligence";
import { cn } from "@/lib/utils";

export function RiskFactorBreakdown({ factors, total }: { factors: RiskFactor[]; total: number }) {
  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Risk factors</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Why the score is {total}</h2>
      <div className="mt-5 space-y-4">
        {factors.map((factor) => (
          <div key={factor.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <p className="font-medium">{factor.label}</p>
              <p className="font-mono text-xs">
                {factor.score} / {factor.max}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ecece6]">
              <div
                className={cn("h-full rounded-full", factor.direction === "increases" ? "bg-ink" : "bg-lime")}
                style={{ width: `${(factor.score / factor.max) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{factor.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
