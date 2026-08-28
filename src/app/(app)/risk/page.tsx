import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { portfolioRisk } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Risk & Exposure",
};

export default function RiskPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Module 5"
        title="Risk & Exposure"
        description="Portfolio risk intelligence will appear here."
      />
      <EmptyState
        eyebrow="Exposure map"
        title="Concentration, leverage, and delayed twins in one view."
        description="Later modules will surface duplicate financing, over-leveraging, and stage-level risk heat without leaving the twin graph."
        visual={
          <div className="flex h-full flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Mock portfolio score
              </p>
              <p className="mt-4 font-display text-6xl font-semibold text-lime">
                {portfolioRisk.averageScore}
              </p>
            </div>
            <p className="mt-8 text-sm leading-6 text-white/55">{portfolioRisk.concentrationNote}</p>
          </div>
        }
      />
    </div>
  );
}
