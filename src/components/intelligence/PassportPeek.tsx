"use client";

import Link from "next/link";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { AnimatedNumber, Delta } from "@/components/intelligence/AnimatedNumber";
import { useFinancialAssessment } from "@/lib/intelligence/hooks";
import { formatCurrencyINR } from "@/lib/format";

export function PassportIntelligencePeek({ assetId }: { assetId: string }) {
  const assessment = useFinancialAssessment(assetId);
  if (!assessment) return null;

  return (
    <section className="rounded-[1.6rem] bg-ink p-5 text-white md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Decision-support estimate</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Financial intelligence</h2>
        </div>
        <Link href={`/intelligence/${assetId}`} className="text-xs font-semibold uppercase tracking-wide text-lime hover:text-white">
          Open full desk
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/6 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Current realizable value</p>
          <p className="mt-2 font-display text-3xl font-semibold text-lime">
            <AnimatedNumber value={assessment.valuation.currentRealizableValue} />
          </p>
          <Delta value={assessment.valuation.realizableDelta} suffix="₹" />
        </div>
        <div className="rounded-2xl bg-white/6 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Recommended financing capacity</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            <AnimatedNumber value={assessment.financing.maximumSafeFinancing} />
          </p>
          <p className="mt-1 text-xs text-white/45">LTV {assessment.ltv.recommendedLTV}% · not a loan approval</p>
        </div>
        <div className="rounded-2xl bg-white/6 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Risk score</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-display text-3xl font-semibold">{assessment.risk.overallScore}</p>
            <RiskBadge level={assessment.risk.riskLevel} />
          </div>
          <p className="mt-1 text-xs text-white/45">
            {assessment.risk.trend} {assessment.risk.trendDelta ? `${assessment.risk.trendDelta} pts` : ""}
          </p>
        </div>
        <div className="rounded-2xl bg-white/6 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Why this capacity</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {formatCurrencyINR(assessment.valuation.financingEligibleValue, 2)} eligible × {assessment.ltv.recommendedLTV}% LTV.
          </p>
        </div>
      </div>
    </section>
  );
}
