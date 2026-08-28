import type { CapitalAllocationResult } from "@/types/decisions";
import { DecisionBadge } from "@/components/decisions/decision-badge";
import { formatCurrencyINR } from "@/lib/format";
import { motion } from "framer-motion";

export function AllocationTable({ result }: { result: CapitalAllocationResult }) {
  const funded = result.items.filter((item) => item.allocated > 0);
  const rest = result.items.filter((item) => item.allocated <= 0);

  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Allocation by asset</p>
      <div className="mt-4 space-y-3">
        {funded.map((item) => (
          <div key={item.assetId} className="rounded-2xl bg-[#f4f4f0] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-ink/45">{item.assetId}</p>
                <p className="font-medium">{item.assetName}</p>
              </div>
              <DecisionBadge category={item.category} compact />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <p className="text-sm">
                Capacity <span className="font-semibold">{formatCurrencyINR(item.recommendedCapacity, 2)}</span>
              </p>
              <p className="text-sm">
                Allocated <span className="font-semibold">{formatCurrencyINR(item.allocated, 2)}</span>
              </p>
              <p className="text-sm text-muted-foreground">{item.reason}</p>
            </div>
          </div>
        ))}
        {result.unallocatedCapital > 0 ? (
          <div className="rounded-2xl bg-ink px-4 py-4 text-white">
            <p className="text-[11px] uppercase tracking-wide text-lime">Reserve</p>
            <p className="mt-1 font-display text-2xl font-semibold">{formatCurrencyINR(result.unallocatedCapital, 2)}</p>
            <p className="mt-2 text-sm leading-6 text-white/70">{result.unusedReason}</p>
          </div>
        ) : null}
        {rest.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Not allocated: {rest.map((item) => item.assetId).join(", ")}
          </p>
        ) : null}
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#ecece6]">
        <div className="flex h-full">
          {funded.map((item, index) => (
            <motion.div
              key={item.assetId}
              initial={{ width: 0 }}
              animate={{ width: `${(item.allocated / Math.max(result.availableCapital, 1)) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={index % 2 === 0 ? "bg-ink" : "bg-lime"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
