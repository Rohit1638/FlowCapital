import type { DecisionCategory } from "@/types/decisions";
import { DECISION_LABELS } from "@/lib/demo-data/decision-config";
import { cn } from "@/lib/utils";

const styles: Record<DecisionCategory, string> = {
  PRIORITY_FUNDING: "bg-lime text-ink",
  CONDITIONAL_FUNDING: "bg-[#f0e6c8] text-ink",
  HOLD_FOR_REVIEW: "bg-ink text-lime",
  NOT_CURRENTLY_PRIORITIZED: "bg-muted text-muted-foreground",
};

export function DecisionBadge({
  category,
  compact = false,
  className,
}: {
  category: DecisionCategory;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        styles[category],
        className,
      )}
    >
      {compact ? category.replaceAll("_", " ") : DECISION_LABELS[category]}
    </span>
  );
}
