import type { FinancingOpportunityScore } from "@/types/decisions";
import { AnimatedNumber } from "@/components/intelligence/AnimatedNumber";
import { cn } from "@/lib/utils";

export function OpportunityScoreCard({
  opportunity,
  emphasized = false,
}: {
  opportunity: FinancingOpportunityScore;
  emphasized?: boolean;
}) {
  return (
    <article className={cn("rounded-[1.5rem] p-5", emphasized ? "bg-lime text-ink" : "bg-white border border-foreground/10")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-60">Financing opportunity</p>
      <p className="mt-3 font-display text-5xl font-semibold tracking-tight">
        <AnimatedNumber value={opportunity.score} format="score" />
        <span className="ml-1 text-2xl opacity-50">/100</span>
      </p>
      <p className="mt-3 text-sm leading-6 opacity-80">{opportunity.summary}</p>
      <div className="mt-5 space-y-2">
        {opportunity.factors.map((factor) => (
          <div key={factor.id}>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
              <span className="opacity-70">{factor.label}</span>
              <span className="font-semibold">
                {factor.points}/{factor.max}
              </span>
            </div>
            <div className={cn("mt-1 h-1.5 overflow-hidden rounded-full", emphasized ? "bg-ink/10" : "bg-[#ecece6]")}>
              <div
                className={cn("h-full rounded-full", emphasized ? "bg-ink" : "bg-ink")}
                style={{ width: `${(factor.points / factor.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
