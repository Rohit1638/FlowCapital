"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CapitalUnlockCard } from "@/components/decisions/capital-unlock-card";
import { DecisionExplainability } from "@/components/decisions/decision-explainability";
import { FundingDecisionCard } from "@/components/decisions/funding-decision-card";
import { FundingReadinessCard } from "@/components/decisions/funding-readiness";
import { OpportunityScoreCard } from "@/components/decisions/opportunity-score-card";
import { RecommendedActionCard } from "@/components/decisions/recommended-action-card";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { useAssetDecision } from "@/lib/decisions/hooks";
import { formatCurrencyINR } from "@/lib/format";
import { getLifecycleLabel } from "@/lib/lifecycle";
import { pageTransition } from "@/lib/motion";

export function AssetDecisionView({ assetId }: { assetId: string }) {
  const { record } = useAssetDecision(assetId);

  if (!record) {
    return (
      <div className="rounded-[1.6rem] border border-foreground/10 bg-white p-8">
        <h1 className="font-display text-3xl font-semibold">Asset not found</h1>
        <Link href="/decisions" className="mt-4 inline-flex text-sm font-semibold underline">
          Return to the decision center
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Financing decision"
        title="Financing Decision"
        description={`${record.assetName} · ${record.assetId}`}
        meta={
          <div className="rounded-2xl border border-foreground/10 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {getLifecycleLabel(record.stage)}
            </p>
            <div className="mt-2">
              <RiskBadge level={record.riskLevel} />
            </div>
          </div>
        }
      />

      <FundingDecisionCard record={record} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Current realizable value", record.currentRealizableValue],
          ["Recommended LTV", record.recommendedLTV],
          ["Maximum safe financing", record.maximumSafeFinancing],
          ["Data confidence", record.dataConfidence],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-ink/40">{label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">
              {label === "Recommended LTV" || label === "Data confidence"
                ? `${value}%`
                : formatCurrencyINR(Number(value), 2)}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <OpportunityScoreCard opportunity={record.opportunity} emphasized={record.recommendation.category === "PRIORITY_FUNDING"} />
        <FundingReadinessCard readiness={record.readiness} />
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Why this decision?</p>
        <DecisionExplainability explanation={record.explanation} />
      </div>

      <CapitalUnlockCard unlock={record.unlock} />

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recommended actions</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">What to do next</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {record.actions.map((action) => (
            <RecommendedActionCard key={action.id} action={action} />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/intelligence/${record.assetId}`} className="rounded-full bg-ink px-4 py-2 font-semibold text-white">
          Open financial intelligence
        </Link>
        <Link href={`/assets/${record.assetId}`} className="rounded-full border border-foreground/15 px-4 py-2 font-semibold">
          Open digital twin
        </Link>
        <Link href="/allocation" className="rounded-full bg-lime px-4 py-2 font-semibold text-ink">
          Allocate capital
        </Link>
      </div>
    </motion.div>
  );
}
