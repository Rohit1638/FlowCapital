"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DecisionSummary } from "@/components/decisions/decision-summary";
import { DecisionBadge } from "@/components/decisions/decision-badge";
import { PriorityRanking } from "@/components/decisions/priority-ranking";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { DECISION_DISCLAIMER } from "@/lib/demo-data/decision-config";
import { usePortfolioDecisions } from "@/lib/decisions/hooks";
import { formatCurrencyINR } from "@/lib/format";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function DecisionCenter() {
  const { records, summary } = usePortfolioDecisions();
  const featured = records.slice(0, 3);
  const top = records[0] ?? null;

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Capital decisions"
        title="Capital Decision Center"
        description="Prioritize the supply-chain assets where trusted evidence can support the strongest financing decisions."
        meta={
          <Link href="/allocation" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            Open allocation simulator
          </Link>
        }
      />
      <p className="text-xs text-muted-foreground">{DECISION_DISCLAIMER}</p>
      <DecisionSummary summary={summary} top={top} />

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Priority opportunities</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Where limited capital should go first</h2>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-5 grid gap-4 xl:grid-cols-5">
          {featured.map((record, index) => (
            <motion.div key={record.assetId} variants={staggerItem} layout className={index === 0 ? "xl:col-span-3" : "xl:col-span-1"}>
              <Link
                href={`/decisions/${record.assetId}`}
                className={cn(
                  "block h-full rounded-[1.7rem] p-6 transition-transform hover:-translate-y-0.5",
                  index === 0 ? "bg-ink text-white xl:col-span-1" : "border border-foreground/10 bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={cn("font-display text-4xl font-semibold", index === 0 ? "text-lime" : "text-ink")}>
                    #{record.ranking.rank}
                  </p>
                  <DecisionBadge
                    category={record.recommendation.category}
                    compact
                    className={index === 0 ? "bg-lime text-ink" : undefined}
                  />
                </div>
                <p className={cn("mt-4 font-mono text-xs", index === 0 ? "text-white/40" : "text-ink/40")}>{record.assetId}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold leading-snug">{record.assetName}</h3>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <p className={cn("text-[10px] uppercase tracking-wide", index === 0 ? "text-white/40" : "text-ink/40")}>
                      Opportunity
                    </p>
                    <p className="font-display text-2xl font-semibold">{record.opportunity.score}/100</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px] uppercase tracking-wide", index === 0 ? "text-white/40" : "text-ink/40")}>
                      Max safe financing
                    </p>
                    <p className="font-display text-2xl font-semibold">{formatCurrencyINR(record.maximumSafeFinancing, 2)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <RiskBadge level={record.riskLevel} />
                  <span className={cn("text-xs", index === 0 ? "text-white/50" : "text-muted-foreground")}>
                    Readiness {record.readiness.score}
                  </span>
                </div>
                <p className={cn("mt-4 text-sm leading-6", index === 0 ? "text-white/70" : "text-muted-foreground")}>
                  {record.recommendation.primaryReason}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <PriorityRanking records={records} />
    </motion.div>
  );
}
