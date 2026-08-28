"use client";

import Link from "next/link";
import { formatCurrencyINR } from "@/lib/format";
import { usePortfolioIntelligence } from "@/lib/intelligence/hooks";

export function IntelligenceStrip() {
  const assessments = usePortfolioIntelligence();
  const totalSafe = assessments.reduce((sum, item) => sum + item.financing.maximumSafeFinancing, 0);
  const high = assessments.filter((item) => item.risk.riskLevel === "HIGH" || item.risk.riskLevel === "CRITICAL").length;
  const moved = assessments.find((item) => item.assetId === "DA-2026-001" && item.valuation.realizableDelta > 0);

  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Section 02</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Financing intelligence</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/intelligence" className="text-sm font-medium text-ink/60 hover:text-ink">
            Open portfolio desk
          </Link>
          <Link href="/decisions" className="text-sm font-medium text-ink/60 hover:text-ink">
            Open decisions
          </Link>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-ink px-4 py-4 text-white">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Potential safe financing</p>
          <p className="mt-2 font-display text-3xl font-semibold text-lime">{formatCurrencyINR(totalSafe, 2)}</p>
        </div>
        <div className="rounded-2xl bg-[#f4f4f0] px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-ink/40">High / critical risk twins</p>
          <p className="mt-2 font-display text-3xl font-semibold">{String(high).padStart(2, "0")}</p>
        </div>
        <div className="rounded-2xl bg-lime px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">Latest financial change</p>
          <p className="mt-2 text-sm leading-6">
            {moved
              ? `${moved.assetId} realizable value increased by ${formatCurrencyINR(moved.valuation.realizableDelta, 2)} after verified production progress.`
              : "No Module 3 production move yet. Run Event Intelligence to unlock more capacity on DA-2026-001."}
          </p>
        </div>
      </div>
    </section>
  );
}
