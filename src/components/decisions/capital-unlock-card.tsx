import type { CapitalUnlockOpportunity } from "@/types/decisions";
import { DecisionBadge } from "@/components/decisions/decision-badge";
import { AnimatedNumber } from "@/components/intelligence/AnimatedNumber";
import { formatCurrencyINR } from "@/lib/format";

export function CapitalUnlockCard({ unlock }: { unlock: CapitalUnlockOpportunity }) {
  return (
    <section className="rounded-[1.6rem] bg-ink p-6 text-white">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Capital unlock</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">What action can release more capacity?</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/40">Current</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            <AnimatedNumber value={unlock.currentFinancingCapacity} />
          </p>
          <div className="mt-2">
            <DecisionBadge category={unlock.currentCategory} compact className="bg-white/10 text-white" />
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/40">After resolution</p>
          <p className="mt-1 font-display text-3xl font-semibold text-lime">
            <AnimatedNumber value={unlock.potentialFinancingCapacity} />
          </p>
          <div className="mt-2">
            <DecisionBadge category={unlock.potentialCategory} compact />
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/40">Additional unlockable</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {unlock.additionalCapitalUnlockable > 0 ? "+" : ""}
            {formatCurrencyINR(unlock.additionalCapitalUnlockable, 2)}
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-white/6 p-4">
        <p className="text-[11px] uppercase tracking-wide text-white/40">Primary blocker</p>
        <p className="mt-1 text-sm leading-6">{unlock.primaryBlocker}</p>
        <p className="mt-3 text-[11px] uppercase tracking-wide text-white/40">Recommended action</p>
        <p className="mt-1 text-sm leading-6">{unlock.recommendedAction}</p>
      </div>
      <p className="mt-4 text-xs leading-5 text-white/40">{unlock.simulationNote}</p>
    </section>
  );
}
