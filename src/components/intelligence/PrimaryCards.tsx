"use client";

import type { FinancialAssessment } from "@/types/intelligence";
import { AnimatedNumber, Delta } from "@/components/intelligence/AnimatedNumber";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatINRFull } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PrimaryFinancialCards({ assessment }: { assessment: FinancialAssessment }) {
  const cards = [
    {
      label: "Current realizable value",
      value: <AnimatedNumber value={assessment.valuation.currentRealizableValue} className="text-lime" />,
      meta: <Delta value={assessment.valuation.realizableDelta} suffix="₹" />,
      tone: "dark" as const,
    },
    {
      label: "Risk score",
      value: (
        <span>
          <AnimatedNumber value={assessment.risk.overallScore} format="score" />
          <span className="text-lg text-white/40"> / 100</span>
        </span>
      ),
      meta: (
        <div className="flex items-center gap-2">
          <RiskBadge level={assessment.risk.riskLevel} />
          <span className="text-xs text-white/50">{assessment.risk.trend}</span>
        </div>
      ),
      tone: "ink" as const,
    },
    {
      label: "Recommended LTV",
      value: <AnimatedNumber value={assessment.ltv.recommendedLTV} format="pct" />,
      meta: <p className="text-xs text-ink/50">Decision-support estimate</p>,
      tone: "light" as const,
    },
    {
      label: "Recommended financing capacity",
      value: <AnimatedNumber value={assessment.financing.maximumSafeFinancing} />,
      meta: <p className="text-xs text-ink/60">{formatINRFull(assessment.financing.maximumSafeFinancing)} · not a loan approval</p>,
      tone: "lime" as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={cn(
            "flex min-h-[170px] flex-col justify-between rounded-[1.5rem] p-5",
            card.tone === "dark" && "bg-ink text-white",
            card.tone === "ink" && "bg-ink-2 text-white",
            card.tone === "light" && "border border-foreground/10 bg-white",
            card.tone === "lime" && "bg-lime text-ink",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">{card.label}</p>
          <p className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{card.value}</p>
          <div>{card.meta}</div>
        </article>
      ))}
    </div>
  );
}
