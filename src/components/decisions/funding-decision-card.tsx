import type { AssetDecisionRecord } from "@/types/decisions";
import { DecisionBadge } from "@/components/decisions/decision-badge";
import { DECISION_DISCLAIMER } from "@/lib/demo-data/decision-config";
import { READINESS_LABELS } from "@/lib/demo-data/decision-config";
import { formatCurrencyINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FundingDecisionCard({ record }: { record: AssetDecisionRecord }) {
  const tone =
    record.recommendation.category === "PRIORITY_FUNDING"
      ? "bg-lime text-ink"
      : record.recommendation.category === "HOLD_FOR_REVIEW"
        ? "bg-ink text-white"
        : record.recommendation.category === "CONDITIONAL_FUNDING"
          ? "bg-white border border-foreground/10"
          : "bg-[#ecece6]";

  return (
    <section className={cn("rounded-[1.8rem] p-6 md:p-8", tone)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-55">Decision-support recommendation</p>
      <div className="mt-4">
        <DecisionBadge category={record.recommendation.category} className="bg-white/80 text-ink" />
      </div>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">{record.recommendation.label}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 opacity-80">{record.recommendation.headline}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide opacity-50">Opportunity</p>
          <p className="font-display text-2xl font-semibold">{record.opportunity.score}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide opacity-50">Readiness</p>
          <p className="font-display text-2xl font-semibold">{READINESS_LABELS[record.readiness.band]}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide opacity-50">Max safe financing</p>
          <p className="font-display text-2xl font-semibold">{formatCurrencyINR(record.maximumSafeFinancing, 2)}</p>
        </div>
      </div>
      <p className="mt-6 text-xs leading-5 opacity-55">{DECISION_DISCLAIMER}</p>
    </section>
  );
}
