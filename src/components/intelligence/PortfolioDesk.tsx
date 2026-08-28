"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatCurrencyINR } from "@/lib/format";
import { useLiveAssets } from "@/lib/demo-store";
import { usePortfolioIntelligence } from "@/lib/intelligence/hooks";
import { pageTransition } from "@/lib/motion";
import type { IntelligenceRiskLevel } from "@/types/intelligence";

const LEVELS: IntelligenceRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function PortfolioIntelligence() {
  const assets = useLiveAssets();
  const assessments = usePortfolioIntelligence();

  const totals = assessments.reduce(
    (acc, item) => {
      acc.contractual += item.valuation.contractualValue;
      acc.realizable += item.valuation.currentRealizableValue;
      acc.eligible += item.valuation.financingEligibleValue;
      acc.safe += item.financing.maximumSafeFinancing;
      if (item.risk.riskLevel === "HIGH" || item.risk.riskLevel === "CRITICAL") {
        acc.high += item.financing.maximumSafeFinancing;
      }
      if (item.risk.factors.some((factor) => factor.id === "conflict" && factor.score >= 8)) {
        acc.conflicts += 1;
      }
      return acc;
    },
    { contractual: 0, realizable: 0, eligible: 0, safe: 0, high: 0, conflicts: 0 },
  );

  const opportunities = [...assessments]
    .filter((item) => (item.risk.riskLevel === "LOW" || item.risk.riskLevel === "MEDIUM") && item.risk.dataConfidence >= 80 && item.financing.maximumSafeFinancing > 0)
    .sort((a, b) => b.financing.maximumSafeFinancing - a.financing.maximumSafeFinancing)
    .slice(0, 4);

  const attention = [...assessments]
    .filter((item) => item.risk.riskLevel === "HIGH" || item.risk.riskLevel === "CRITICAL" || item.risk.alerts.length > 0)
    .sort((a, b) => b.risk.overallScore - a.risk.overallScore);

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Portfolio Intelligence"
        description="See where capital can move safely across the supply chain."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total contractual value", totals.contractual],
          ["Current realizable value", totals.realizable],
          ["Financing eligible value", totals.eligible],
          ["Potential safe financing", totals.safe],
        ].map(([label, value], index) => (
          <article key={label} className={`rounded-[1.5rem] p-5 ${index === 3 ? "bg-lime text-ink" : "bg-ink text-white"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">{label}</p>
            <p className="mt-4 font-display text-3xl font-semibold">{formatCurrencyINR(Number(value), 2)}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {LEVELS.map((level) => {
          const group = assessments.filter((item) => item.risk.riskLevel === level);
          const capacity = group.reduce((sum, item) => sum + item.financing.maximumSafeFinancing, 0);
          return (
            <div key={level} className="rounded-[1.4rem] border border-foreground/10 bg-white p-4">
              <RiskBadge level={level} />
              <p className="mt-3 font-display text-2xl font-semibold">{String(group.length).padStart(2, "0")}</p>
              <p className="text-sm text-muted-foreground">assets · {formatCurrencyINR(capacity, 2)} capacity</p>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        High-risk exposure {formatCurrencyINR(totals.high, 2)} · assets with open conflicts {String(totals.conflicts).padStart(2, "0")}
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Best financing opportunities</p>
          <div className="mt-4 space-y-3">
            {opportunities.map((item) => {
              const asset = assets.find((row) => row.id === item.assetId);
              return (
                <Link key={item.assetId} href={`/intelligence/${item.assetId}`} className="block rounded-2xl bg-[#f4f4f0] px-4 py-3 hover:bg-[#ecece6]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs">{item.assetId}</p>
                      <p className="font-medium">{asset?.name}</p>
                    </div>
                    <p className="font-display text-lg font-semibold">{formatCurrencyINR(item.financing.maximumSafeFinancing, 2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="rounded-[1.6rem] bg-ink p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Assets requiring attention</p>
          <div className="mt-4 space-y-3">
            {attention.map((item) => (
              <Link key={item.assetId} href={`/intelligence/${item.assetId}`} className="block rounded-2xl bg-white/6 px-4 py-3 hover:bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm">{item.assetId}</p>
                  <p className="text-sm">
                    Risk {item.risk.overallScore} · {item.risk.riskLevel}
                  </p>
                </div>
              </Link>
            ))}
            {attention.length === 0 ? <p className="text-sm text-white/50">No high-severity holds.</p> : null}
            <Link href="/decisions" className="inline-flex text-sm font-medium text-lime hover:text-white">
              Open capital decisions
            </Link>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
