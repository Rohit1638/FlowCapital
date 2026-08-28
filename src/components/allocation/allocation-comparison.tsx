import type { AllocationComparisonRow } from "@/types/decisions";
import { STRATEGY_COPY } from "@/lib/demo-data/decision-config";
import { formatCurrencyINR } from "@/lib/format";

export function AllocationComparison({ rows }: { rows: AllocationComparisonRow[] }) {
  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Strategy comparison</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Same capital, four decision postures</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <article key={row.strategy} className="rounded-2xl bg-[#f4f4f0] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">{STRATEGY_COPY[row.strategy].name}</p>
            <p className="mt-3 text-sm">
              Assets funded <span className="font-semibold">{row.assetsFunded}</span>
            </p>
            <p className="text-sm">
              Deployed <span className="font-semibold">{formatCurrencyINR(row.capitalDeployed, 2)}</span>
            </p>
            <p className="text-sm">
              Average risk <span className="font-semibold">{row.averageRiskLevel}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Concentration {row.concentration}%</p>
          </article>
        ))}
      </div>
    </section>
  );
}
