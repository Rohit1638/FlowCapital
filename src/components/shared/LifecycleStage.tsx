import type { LifecycleAggregate } from "@/types/asset";
import { STAGE_LABELS } from "@/lib/mock-data";
import { formatINRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LifecycleStage({
  item,
  isLast,
}: {
  item: LifecycleAggregate;
  isLast?: boolean;
}) {
  return (
    <div className="flex min-w-[148px] flex-1 items-stretch">
      <div
        className={cn(
          "flex w-full flex-col justify-between rounded-[1.15rem] border px-4 py-4 transition-transform duration-300 hover:-translate-y-0.5",
          item.attention
            ? "border-transparent bg-lime text-ink"
            : "border-foreground/10 bg-white text-ink",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
          {STAGE_LABELS[item.stage]}
        </p>
        <div className="mt-6">
          <p className="font-display text-2xl font-semibold">{item.assetCount}</p>
          <p className="text-xs text-ink/55">Assets</p>
          <p className="mt-2 text-sm font-medium">{formatINRCompact(item.totalValue)}</p>
        </div>
      </div>
      {!isLast ? (
        <div className="mx-1 hidden w-4 items-center lg:flex">
          <div className="h-px w-full bg-foreground/20" />
        </div>
      ) : null}
    </div>
  );
}
