"use client";

import { motion } from "framer-motion";
import { AllocationComparison } from "@/components/allocation/allocation-comparison";
import { AllocationStrategySelector } from "@/components/allocation/allocation-strategy-selector";
import { AllocationSummary } from "@/components/allocation/allocation-summary";
import { AllocationTable } from "@/components/allocation/allocation-table";
import { AvailableCapitalInput } from "@/components/allocation/available-capital-input";
import { CapitalUtilization } from "@/components/allocation/capital-utilization";
import { DecisionBadge } from "@/components/decisions/decision-badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DECISION_DISCLAIMER } from "@/lib/demo-data/decision-config";
import { PORTFOLIO_UNLOCK_SCENARIO } from "@/lib/demo-data/unlock-scenarios";
import {
  useAllocationComparison,
  useAllocationWhatIf,
  useCapitalAllocation,
  useDecisionPrefs,
  usePortfolioDecisions,
} from "@/lib/decisions/hooks";
import { formatCurrencyINR } from "@/lib/format";
import { pageTransition } from "@/lib/motion";

export function AllocationDesk() {
  const [prefs, setPrefs] = useDecisionPrefs();
  const { summary } = usePortfolioDecisions();
  const result = useCapitalAllocation({
    availableCapital: prefs.availableCapital,
    strategy: prefs.strategy,
  });
  const comparison = useAllocationComparison(prefs.availableCapital);
  const whatIf = useAllocationWhatIf(prefs.availableCapital, prefs.strategy);
  const topUnlock = whatIf.unlockHighlights[0];

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Capital allocation"
        title="Capital Allocation Simulator"
        description="See how available capital can be deployed across trusted supply-chain assets."
      />
      <p className="text-xs text-muted-foreground">{DECISION_DISCLAIMER}</p>

      <section className="rounded-[1.7rem] bg-ink p-6 text-white md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Recommended capital strategy</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight">{result.executiveSummary}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/40">Assets funded</p>
            <p className="font-display text-2xl font-semibold">{String(result.assetsFunded).padStart(2, "0")}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/40">Capital deployed</p>
            <p className="font-display text-2xl font-semibold">{formatCurrencyINR(result.allocatedCapital, 2)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/40">Capital reserved</p>
            <p className="font-display text-2xl font-semibold">{formatCurrencyINR(result.unallocatedCapital, 2)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/40">Potential capital unlock</p>
            <p className="font-display text-2xl font-semibold text-lime">
              +{formatCurrencyINR(summary.blockedCapital > 0 ? whatIf.additionalDeployable : 0, 2)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <AvailableCapitalInput value={prefs.availableCapital} onChange={(availableCapital) => setPrefs({ availableCapital })} />
        <CapitalUtilization result={result} />
      </div>

      <AllocationStrategySelector value={prefs.strategy} onChange={(strategy) => setPrefs({ strategy })} />
      <AllocationSummary result={result} />
      <AllocationTable result={result} />
      <AllocationComparison rows={comparison} />

      <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">What-if capital allocation</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Current portfolio vs improved evidence</h2>
          </div>
          <button
            type="button"
            onClick={() => setPrefs({ showUnlockedComparison: !prefs.showUnlockedComparison })}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            {prefs.showUnlockedComparison ? "Hide improved book" : "Simulate operational unlocks"}
          </button>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{PORTFOLIO_UNLOCK_SCENARIO.summary}</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl bg-[#f4f4f0] p-4">
            <p className="text-[11px] uppercase tracking-wide text-ink/40">Current</p>
            <p className="mt-2 font-display text-2xl font-semibold">{formatCurrencyINR(whatIf.current.allocatedCapital, 2)} deployed</p>
            <p className="mt-1 text-sm text-muted-foreground">{whatIf.current.assetsFunded} assets funded</p>
          </article>
          <article className="rounded-2xl bg-lime p-4 text-ink">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Improved (simulated)</p>
            <p className="mt-2 font-display text-2xl font-semibold">{formatCurrencyINR(whatIf.improved.allocatedCapital, 2)} deployed</p>
            <p className="mt-1 text-sm">+{formatCurrencyINR(whatIf.additionalDeployable, 2)} additional deployable capital</p>
          </article>
        </div>
        {prefs.showUnlockedComparison ? (
          <div className="mt-4 space-y-3">
            {whatIf.unlockHighlights.slice(0, 4).map((item) => (
              <div key={item.assetId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/8 px-4 py-3">
                <p className="font-mono text-sm">{item.assetId}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge category={item.from} compact />
                  <span className="text-xs text-muted-foreground">→</span>
                  <DecisionBadge category={item.to} compact />
                </div>
                <p className="text-sm font-semibold">+{formatCurrencyINR(item.additionalCapital, 2)}</p>
              </div>
            ))}
          </div>
        ) : null}
        <p className="mt-4 text-sm leading-6">{whatIf.highlight}</p>
        {topUnlock ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Largest simulated unlock: {topUnlock.assetId}. Twin state is unchanged until a Module 3 event is actually applied.
          </p>
        ) : null}
      </section>
    </motion.div>
  );
}
