import type { AllocationStrategy } from "@/types/decisions";
import { STRATEGY_COPY, STRATEGY_ORDER } from "@/lib/demo-data/decision-config";
import { cn } from "@/lib/utils";

export function AllocationStrategySelector({
  value,
  onChange,
}: {
  value: AllocationStrategy;
  onChange: (value: AllocationStrategy) => void;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {STRATEGY_ORDER.map((strategy) => (
        <button
          key={strategy}
          type="button"
          onClick={() => onChange(strategy)}
          className={cn(
            "rounded-[1.4rem] border p-4 text-left transition-colors",
            value === strategy ? "border-ink bg-ink text-white" : "border-foreground/10 bg-white hover:bg-[#f4f4f0]",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">{STRATEGY_COPY[strategy].name}</p>
          <p className="mt-2 text-sm leading-6 opacity-80">{STRATEGY_COPY[strategy].summary}</p>
        </button>
      ))}
    </section>
  );
}
