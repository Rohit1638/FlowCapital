import type { FundingReadiness } from "@/types/decisions";
import { READINESS_LABELS } from "@/lib/demo-data/decision-config";
import { AnimatedNumber } from "@/components/intelligence/AnimatedNumber";

export function FundingReadinessCard({ readiness }: { readiness: FundingReadiness }) {
  return (
    <article className="rounded-[1.5rem] border border-foreground/10 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Funding readiness</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-5xl font-semibold">
          <AnimatedNumber value={readiness.score} format="score" />
          <span className="ml-1 text-2xl text-muted-foreground">/100</span>
        </p>
        <span className="rounded-full bg-[#f4f4f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
          {READINESS_LABELS[readiness.band]}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{readiness.summary}</p>
      <div className="mt-5 space-y-2">
        {readiness.components.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink/70">{item.label}</span>
            <span className="font-mono text-xs">
              {item.points}/{item.max}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
