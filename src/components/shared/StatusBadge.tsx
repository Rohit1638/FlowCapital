import type { FinancingStatus, LifecycleStage } from "@/types/asset";
import { STAGE_LABELS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<FinancingStatus, string> = {
  UNFINANCED: "bg-muted text-foreground",
  PENDING_REVIEW: "bg-[#17181F] text-lime",
  PARTIAL: "bg-lime/30 text-ink",
  FINANCED: "bg-lime text-ink",
  REFINANCE_ELIGIBLE: "border border-ink/15 bg-white text-ink",
  SETTLED: "bg-ink text-white",
};

const statusCopy: Record<FinancingStatus, string> = {
  UNFINANCED: "Unfinanced",
  PENDING_REVIEW: "Pending review",
  PARTIAL: "Partial",
  FINANCED: "Financed",
  REFINANCE_ELIGIBLE: "Refinance",
  SETTLED: "Settled",
};

export function StatusBadge({
  status,
  stage,
  className,
}: {
  status?: FinancingStatus;
  stage?: LifecycleStage;
  className?: string;
}) {
  if (stage) {
    return (
      <span
        className={cn(
          "inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink",
          className,
        )}
      >
        {STAGE_LABELS[stage]}
      </span>
    );
  }

  if (!status) return null;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        statusStyles[status],
        className,
      )}
    >
      {statusCopy[status]}
    </span>
  );
}
