"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { AssetDecisionRecord } from "@/types/decisions";
import { DecisionBadge } from "@/components/decisions/decision-badge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatCurrencyINR } from "@/lib/format";
import { getLifecycleLabel } from "@/lib/lifecycle";
import { cn } from "@/lib/utils";

export function PriorityRanking({ records }: { records: AssetDecisionRecord[] }) {
  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Full priority ranking</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">All eight twins, ranked for capital</h2>
      <div className="mt-5 space-y-2">
        {records.map((record) => (
          <motion.div key={record.assetId} layout>
            <Link
              href={`/decisions/${record.assetId}`}
              className="grid gap-3 rounded-2xl bg-[#f4f4f0] px-4 py-3 transition-colors hover:bg-[#ecece6] md:grid-cols-[4.5rem_1.4fr_repeat(4,0.7fr)_1.2fr]"
            >
              <p className="font-display text-xl font-semibold">#{record.ranking.rank}</p>
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-ink/45">{record.assetId}</p>
                <p className="truncate font-medium">{record.assetName}</p>
                <p className="text-xs text-muted-foreground">{getLifecycleLabel(record.stage)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40">Opportunity</p>
                <p className="font-display text-lg font-semibold">{record.opportunity.score}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40">Readiness</p>
                <p className="font-display text-lg font-semibold">{record.readiness.score}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40">Risk</p>
                <RiskBadge level={record.riskLevel} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink/40">Capacity</p>
                <p className="font-display text-lg font-semibold">{formatCurrencyINR(record.maximumSafeFinancing, 2)}</p>
              </div>
              <div className={cn("flex flex-col items-start gap-2 md:items-end")}>
                <DecisionBadge category={record.recommendation.category} compact />
                <p className="text-xs leading-5 text-muted-foreground md:text-right">{record.actions[0]?.action}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
