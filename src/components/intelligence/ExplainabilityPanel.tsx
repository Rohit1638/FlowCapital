"use client";

import type { RiskAssessment } from "@/types/intelligence";

export function ExplainabilityPanel({ risk }: { risk: RiskAssessment }) {
  return (
    <section className="rounded-[1.6rem] bg-ink p-5 text-white md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Explainability</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Why is the risk {risk.overallScore}?</h2>
      <p className="mt-3 text-sm leading-6 text-white/65">{risk.explanation}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white/6 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Increases risk</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/80">
            {risk.primaryDrivers.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white/6 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lime">Reduces risk</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/80">
            {risk.positiveSignals.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
