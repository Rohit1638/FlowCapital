import type { CapitalAllocationResult } from "@/types/decisions";
import { formatCurrencyINR } from "@/lib/format";

export function CapitalUtilization({ result }: { result: CapitalAllocationResult }) {
  const pct = result.availableCapital > 0 ? Math.round((result.allocatedCapital / result.availableCapital) * 100) : 0;
  return (
    <section className="rounded-[1.5rem] bg-lime p-5 text-ink">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">Capital utilization</p>
      <p className="mt-2 font-display text-4xl font-semibold">{pct}%</p>
      <p className="mt-2 text-sm leading-6">
        {formatCurrencyINR(result.allocatedCapital, 2)} deployed of {formatCurrencyINR(result.availableCapital, 2)} available.
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}
