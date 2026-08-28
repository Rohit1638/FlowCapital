"use client";

import Link from "next/link";
import { formatCurrencyINR } from "@/lib/format";
import { usePortfolioDecisions } from "@/lib/decisions/hooks";
import { DecisionBadge } from "@/components/decisions/decision-badge";

export function DecisionStrip() {
  const { records, summary } = usePortfolioDecisions();
  const top = records[0] ?? null;
  const blockedCount = records.filter((item) => item.recommendation.category === "HOLD_FOR_REVIEW").length;

  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Section 03</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Capital decision snapshot</h2>
        </div>
        <Link href="/decisions" className="text-sm font-medium text-ink/60 hover:text-ink">
          Open decision center
        </Link>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-ink px-4 py-4 text-white">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Top opportunity</p>
          {top ? (
            <>
              <p className="mt-2 font-mono text-xs text-white/45">{top.assetId}</p>
              <p className="font-display text-xl font-semibold leading-snug">{top.assetName}</p>
              <p className="mt-2 text-lime">{formatCurrencyINR(top.maximumSafeFinancing, 2)} safe capacity</p>
              <div className="mt-3">
                <DecisionBadge category={top.recommendation.category} compact className="bg-lime text-ink" />
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/60">No ranked assets.</p>
          )}
        </div>
        <div className="rounded-2xl bg-lime px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">Capital ready today</p>
          <p className="mt-2 font-display text-3xl font-semibold">{formatCurrencyINR(summary.priorityFundingPotential, 2)}</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">Priority-funding capacity across ready twins.</p>
        </div>
        <div className="rounded-2xl bg-[#f4f4f0] px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-ink/40">Capital blocked</p>
          <p className="mt-2 font-display text-3xl font-semibold">{formatCurrencyINR(summary.blockedCapital, 2)}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Unlockable after resolving {blockedCount} major operational issue{blockedCount === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-ink/40">Highest priority action</p>
          <p className="mt-2 text-sm leading-6">{summary.highestPriorityAction}</p>
          <Link href="/allocation" className="mt-3 inline-flex text-sm font-semibold underline">
            Simulate allocation
          </Link>
        </div>
      </div>
    </section>
  );
}
