"use client";

import { motion } from "framer-motion";
import { PlatformLaunchBanner } from "@/components/platform/PlatformLaunchBanner";
import { CapitalOverview } from "@/components/dashboard/CapitalOverview";
import { ConnectorStatusBar } from "@/components/dashboard/ConnectorStatusBar";
import { DecisionStrip } from "@/components/dashboard/DecisionStrip";
import { IntelligenceStrip } from "@/components/dashboard/IntelligenceStrip";
import { FinancialMovementChart } from "@/components/dashboard/FinancialMovementChart";
import { ActiveAssets } from "@/components/dashboard/ActiveAssets";
import { EventFeed } from "@/components/dashboard/EventFeed";
import { AIInsightCard } from "@/components/shared/AIInsightCard";
import { LifecycleOverview } from "@/components/shared/LifecycleOverview";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { PageHeader } from "@/components/shared/PageHeader";
import { featuredInsight } from "@/lib/mock-data";
import { useLiveAssets } from "@/lib/demo-store";
import { deriveLifecycleAggregates } from "@/lib/selectors";
import { pageTransition } from "@/lib/motion";

const dateLabel = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date("2026-08-28"));

export default function DashboardPage() {
  const assets = useLiveAssets();
  const stages = deriveLifecycleAggregates(assets);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageTransition}
      className="flex w-full flex-col gap-8"
    >
      <PageHeader
        title="Command Center"
        description="Your supply-chain capital, continuously in motion."
        meta={
          <div className="rounded-2xl border border-foreground/10 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {dateLabel}
            </p>
            <div className="mt-2">
              <LiveIndicator />
            </div>
          </div>
        }
      />
      <PlatformLaunchBanner />
      <CapitalOverview />
      <ConnectorStatusBar />
      <IntelligenceStrip />
      <DecisionStrip />
      <LifecycleOverview stages={stages} />
      <FinancialMovementChart />
      <ActiveAssets />
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <EventFeed />
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Section 06
          </p>
          <AIInsightCard insight={featuredInsight} />
        </div>
      </div>
    </motion.div>
  );
}
