"use client";

import { motion } from "framer-motion";
import { DemoSimulator } from "@/components/assets/DemoSimulator";
import { DataSourceConfidence } from "@/components/assets/DataSourceConfidence";
import { EventTimeline } from "@/components/assets/EventTimeline";
import { PassportIntelligencePeek } from "@/components/intelligence/PassportPeek";
import { FinancialMemory } from "@/components/assets/FinancialMemory";
import { LifecycleRail } from "@/components/assets/LifecycleRail";
import { PassportHeader } from "@/components/assets/PassportHeader";
import { PassportSummary } from "@/components/assets/PassportSummary";
import { RiskHistoryChart } from "@/components/assets/RiskHistoryChart";
import { StageContextBanner } from "@/components/assets/StageContextBanner";
import { TwinStatePanels } from "@/components/assets/TwinStatePanels";
import { PRIMARY_ASSET_ID } from "@/lib/demo-data";
import { getFinancingForAsset } from "@/lib/demo-data/financing";
import { getRiskHistoryForAsset } from "@/lib/demo-data/risk-history";
import { getSourcesForAsset } from "@/lib/demo-data/sources";
import { useDemoSimulation, useLiveEvents } from "@/lib/demo-store";
import { pageTransition } from "@/lib/motion";

export function AssetPassport({ assetId }: { assetId: string }) {
  const { asset, overlay, runStep, reset } = useDemoSimulation(assetId);
  const events = useLiveEvents(assetId);

  if (!asset) {
    return null;
  }

  const financing = getFinancingForAsset(assetId);
  const risk = getRiskHistoryForAsset(assetId);
  const sources = getSourcesForAsset(assetId);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageTransition}
      className="flex w-full flex-col gap-6"
    >
      <PassportHeader asset={asset} />
      <StageContextBanner asset={asset} />
      <PassportSummary asset={asset} />
      <LifecycleRail
        currentStage={asset.currentStage}
        productionCompletion={asset.physical.productionCompletion}
      />
      <TwinStatePanels asset={asset} />
      <div className="grid items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-4">
          <EventTimeline events={events} />
          <PassportIntelligencePeek assetId={assetId} />
        </div>
        <div className="flex flex-col gap-4">
          <FinancialMemory records={financing} />
          <RiskHistoryChart history={risk} currentScore={asset.riskScore} />
          <DataSourceConfidence sources={sources} />
        </div>
      </div>
      {assetId === PRIMARY_ASSET_ID ? (
        <DemoSimulator step={overlay.step} onStep={runStep} onReset={reset} />
      ) : null}
    </motion.div>
  );
}
