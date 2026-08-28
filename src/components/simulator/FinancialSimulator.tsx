"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { FINANCIAL_SCENARIOS } from "@/lib/demo-data/financial-scenarios";
import { useLiveAssets } from "@/lib/demo-store";
import { useSimulation } from "@/lib/intelligence/hooks";
import { formatCurrencyINR } from "@/lib/format";
import { pageTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { SimulationInput, SimulatorFinancial, SimulatorLogistics, SimulatorVerification } from "@/types/intelligence";
import { getStageIndex } from "@/lib/lifecycle";

const emptyInput = (): SimulationInput => ({});

export function FinancialSimulator() {
  const assets = useLiveAssets();
  const [assetId, setAssetId] = useState("DA-2026-001");
  const [input, setInput] = useState<SimulationInput>({ productionCompletion: 90 });
  const [applied, setApplied] = useState<SimulationInput | null>({ productionCompletion: 90 });
  const result = useSimulation(assetId, applied);
  const asset = assets.find((item) => item.id === assetId);
  const stageIndex = asset ? getStageIndex(asset.currentStage) : 0;
  const showProduction = stageIndex >= getStageIndex("RAW_MATERIAL") && stageIndex <= getStageIndex("PRODUCTION");
  const showLogistics = stageIndex >= getStageIndex("FINISHED_GOODS");
  const showPayment = stageIndex >= getStageIndex("INVOICE");

  const rows = useMemo(() => {
    if (!result) return [];
    return [
      ["Current realizable value", result.current.valuation.currentRealizableValue, result.simulated.valuation.currentRealizableValue, "inr"],
      ["Risk score", result.current.risk.overallScore, result.simulated.risk.overallScore, "score"],
      ["Recommended LTV", result.current.ltv.recommendedLTV, result.simulated.ltv.recommendedLTV, "pct"],
      ["Financing eligible value", result.current.valuation.financingEligibleValue, result.simulated.valuation.financingEligibleValue, "inr"],
      ["Recommended financing capacity", result.current.financing.maximumSafeFinancing, result.simulated.financing.maximumSafeFinancing, "inr"],
    ] as const;
  }, [result]);

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Simulation"
        title="What-If Simulator"
        description="See how operational changes impact value, risk, and financing capacity."
      />
      <p className="rounded-2xl bg-lime px-4 py-3 text-sm font-semibold text-ink">
        SIMULATED results never overwrite the Digital Asset Twin.
      </p>
      <div className="flex flex-wrap gap-2">
        {FINANCIAL_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => {
              setAssetId(scenario.assetId);
              setInput(scenario.input);
              setApplied(scenario.input);
            }}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
          >
            {scenario.name}
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Controls</p>
          <label className="mt-4 block text-sm">
            Asset
            <select
              className="mt-1 h-11 w-full rounded-full border border-foreground/12 px-3"
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                setApplied(null);
              }}
              aria-label="Select asset"
            >
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.name}
                </option>
              ))}
            </select>
          </label>
          {showProduction ? (
            <label className="mt-4 block text-sm">
              Production progress {input.productionCompletion ?? asset?.physical.productionCompletion ?? 0}%
              <input
                type="range"
                min={0}
                max={100}
                className="mt-2 w-full"
                value={input.productionCompletion ?? asset?.physical.productionCompletion ?? 0}
                onChange={(e) => setInput({ ...input, productionCompletion: Number(e.target.value) })}
              />
            </label>
          ) : null}
          <label className="mt-4 block text-sm">
            Verification
            <select
              className="mt-1 h-11 w-full rounded-full border border-foreground/12 px-3"
              value={input.verificationStatus ?? "VERIFIED"}
              onChange={(e) => setInput({ ...input, verificationStatus: e.target.value as SimulatorVerification })}
            >
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_VERIFIED">Partially verified</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </label>
          <label className="mt-4 block text-sm">
            Data confidence {input.dataConfidence ?? 90}%
            <input
              type="range"
              min={50}
              max={100}
              className="mt-2 w-full"
              value={input.dataConfidence ?? 90}
              onChange={(e) => setInput({ ...input, dataConfidence: Number(e.target.value) })}
            />
          </label>
          <label className="mt-4 block text-sm">
            Conflict severity
            <select
              className="mt-1 h-11 w-full rounded-full border border-foreground/12 px-3"
              value={input.conflictSeverity ?? "NONE"}
              onChange={(e) =>
                setInput({
                  ...input,
                  conflictSeverity: e.target.value as SimulationInput["conflictSeverity"],
                  openConflictCount: e.target.value === "NONE" ? 0 : 1,
                })
              }
            >
              <option value="NONE">None</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
          {showLogistics ? (
            <label className="mt-4 block text-sm">
              Logistics
              <select
                className="mt-1 h-11 w-full rounded-full border border-foreground/12 px-3"
                value={input.logisticsStatus ?? "NORMAL"}
                onChange={(e) => setInput({ ...input, logisticsStatus: e.target.value as SimulatorLogistics })}
              >
                <option value="NORMAL">Normal</option>
                <option value="DELAYED">Delayed</option>
                <option value="SEVERELY_DELAYED">Severely delayed</option>
              </select>
            </label>
          ) : null}
          {showPayment ? (
            <label className="mt-4 block text-sm">
              Financial status
              <select
                className="mt-1 h-11 w-full rounded-full border border-foreground/12 px-3"
                value={input.financialStatus ?? "NORMAL"}
                onChange={(e) => setInput({ ...input, financialStatus: e.target.value as SimulatorFinancial })}
              >
                <option value="NORMAL">Normal</option>
                <option value="PAYMENT_DELAYED">Payment delayed</option>
                <option value="PAYMENT_RECEIVED">Payment received</option>
              </select>
            </label>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" variant="lime" onClick={() => setApplied({ ...input })}>
              Compare results
            </Button>
            <Button type="button" variant="outline" onClick={() => { setInput(emptyInput()); setApplied(null); }}>
              Reset simulation
            </Button>
          </div>
        </section>
        <section className="rounded-[1.6rem] bg-[#ecece6] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/45">Current vs simulated</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Impact comparison</h2>
          <div className="mt-5 space-y-3">
            {rows.map(([label, current, simulated, kind]) => {
              const delta = simulated - current;
              return (
                <div key={label} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-ink/40">{label}</p>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
                    <p>Now {kind === "inr" ? formatCurrencyINR(current, 2) : kind === "pct" ? `${current}%` : current}</p>
                    <p className="font-semibold">Sim {kind === "inr" ? formatCurrencyINR(simulated, 2) : kind === "pct" ? `${simulated}%` : simulated}</p>
                    <p className={cn(delta >= 0 ? "text-[#5b8f24]" : "text-[#b5473c]")}>
                      {delta >= 0 ? "+" : ""}
                      {kind === "inr" ? formatCurrencyINR(delta, 2) : delta}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {result ? (
            <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
              <div className="flex items-center gap-2">
                <RiskBadge level={result.simulated.risk.riskLevel} />
                <span className="text-xs uppercase tracking-wide text-lime">Simulated</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/70">{result.explanation}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Apply a scenario or compare results to see impact.</p>
          )}
        </section>
      </div>
    </motion.div>
  );
}
