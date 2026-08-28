import type { CapitalAllocationResult } from "@/types/decisions";
import { AnimatedNumber } from "@/components/intelligence/AnimatedNumber";
import { RiskBadge } from "@/components/shared/RiskBadge";

export function AllocationSummary({ result }: { result: CapitalAllocationResult }) {
  const cells = [
    { label: "Available capital", value: result.availableCapital },
    { label: "Allocated capital", value: result.allocatedCapital },
    { label: "Unallocated capital", value: result.unallocatedCapital },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cells.map((cell) => (
        <article key={cell.label} className="rounded-[1.4rem] bg-ink p-4 text-white">
          <p className="text-[11px] uppercase tracking-wide text-white/40">{cell.label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-lime">
            <AnimatedNumber value={cell.value} />
          </p>
        </article>
      ))}
      <article className="rounded-[1.4rem] border border-foreground/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-wide text-ink/40">Assets funded</p>
        <p className="mt-2 font-display text-2xl font-semibold">{String(result.assetsFunded).padStart(2, "0")}</p>
      </article>
      <article className="rounded-[1.4rem] border border-foreground/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-wide text-ink/40">Average portfolio risk</p>
        <div className="mt-2">
          <RiskBadge level={result.averageRiskLevel} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{result.averagePortfolioRisk}/100 weighted</p>
      </article>
      <article className="rounded-[1.4rem] border border-foreground/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-wide text-ink/40">Capital concentration</p>
        <p className="mt-2 font-display text-2xl font-semibold">{result.capitalConcentration}%</p>
        <p className="mt-1 text-xs text-muted-foreground">Largest share of deployed capital</p>
      </article>
    </div>
  );
}
