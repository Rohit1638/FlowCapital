import type { RecommendedAction } from "@/types/decisions";
import { formatCurrencyINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RecommendedActionCard({ action }: { action: RecommendedAction }) {
  return (
    <article className="rounded-[1.4rem] border border-foreground/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            action.priority === "HIGH" && "bg-ink text-lime",
            action.priority === "MEDIUM" && "bg-[#f0e6c8] text-ink",
            action.priority === "LOW" && "bg-[#f4f4f0] text-ink/70",
          )}
        >
          {action.priority} priority
        </span>
        {action.potentialCapitalDelta > 0 ? (
          <span className="text-xs font-semibold text-[#5b8f24]">+{formatCurrencyINR(action.potentialCapitalDelta, 2)}</span>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{action.action}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.whyItMatters}</p>
      <p className="mt-3 text-sm leading-6">{action.expectedImpact}</p>
    </article>
  );
}
