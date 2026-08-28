"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ExplainabilityPanel } from "@/components/intelligence/ExplainabilityPanel";
import { FinancingExplainability } from "@/components/intelligence/FinancingExplainability";
import { PrimaryFinancialCards } from "@/components/intelligence/PrimaryCards";
import { RiskFactorBreakdown } from "@/components/intelligence/RiskFactorBreakdown";
import { ValuationBreakdown } from "@/components/intelligence/ValuationCard";
import { RiskHistoryChart } from "@/components/assets/RiskHistoryChart";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLiveAsset } from "@/lib/demo-store";
import { getLifecycleLabel } from "@/lib/format";
import { useFinancialAssessment, useRiskPath } from "@/lib/intelligence/hooks";
import { pageTransition } from "@/lib/motion";

export function AssetFinancialIntelligence({ assetId }: { assetId: string }) {
  const asset = useLiveAsset(assetId);
  const assessment = useFinancialAssessment(assetId);
  const history = useRiskPath(assetId);

  if (!asset || !assessment) {
    return <p className="text-sm text-muted-foreground">Asset not found.</p>;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <div>
        <Link href="/intelligence" className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Portfolio Intelligence
        </Link>
      </div>
      <PageHeader
        eyebrow="Financial Intelligence"
        title={asset.name}
        description="Turning supply-chain evidence into financing insight."
        meta={
          <div className="rounded-2xl border border-foreground/10 bg-white px-4 py-3">
            <p className="font-mono text-xs">{asset.id}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge stage={asset.currentStage} />
              <RiskBadge level={assessment.risk.riskLevel} />
            </div>
          </div>
        }
      />
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
        <span className="rounded-full bg-white px-3 py-1.5">{getLifecycleLabel(asset.currentStage)}</span>
        <span className="rounded-full bg-white px-3 py-1.5">Verification {asset.physical.verificationStatus.replaceAll("_", " ")}</span>
        <span className="rounded-full bg-lime px-3 py-1.5">Data confidence {assessment.risk.dataConfidence}%</span>
      </div>
      <PrimaryFinancialCards assessment={assessment} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ValuationBreakdown assessment={assessment} />
        <RiskFactorBreakdown factors={assessment.risk.factors} total={assessment.risk.overallScore} />
      </div>
      <ExplainabilityPanel risk={assessment.risk} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RiskHistoryChart history={history} currentScore={assessment.risk.overallScore} />
        <FinancingExplainability assessment={assessment} />
      </div>
      {assessment.risk.alerts.length > 0 ? (
        <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Risk alerts</p>
          <div className="mt-4 space-y-3">
            {assessment.risk.alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl bg-[#f4f4f0] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide">{alert.severity}</p>
                <p className="mt-1 font-medium">{alert.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </motion.div>
  );
}
