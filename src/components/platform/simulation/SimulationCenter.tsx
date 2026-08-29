"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { PhysicalGoodsLifecycleStepper } from "@/components/platform/PhysicalGoodsLifecycleStepper";
import { LenderContent } from "@/components/platform/LenderContent";
import { ManufacturerContent } from "@/components/platform/ManufacturerContent";
import { PlatformMetricCard } from "@/components/platform/PlatformMetricCard";
import { ConfidenceGauge } from "@/components/platform/simulation/ConfidenceGauge";
import { EventGeneratedModal } from "@/components/platform/simulation/EventGeneratedModal";
import { SimulationControls, SimulationResetDialog } from "@/components/platform/simulation/SimulationControls";
import { formatINRCompact } from "@/lib/format";
import { DEMO_REQUEST_ID } from "@/lib/platform/demo-fallback";
import { isRiskAlert } from "@/lib/platform/risk-constants";
import { useSimulation } from "@/lib/platform/simulation-hooks";

interface SimulationCenterProps {
  role: "MANUFACTURER" | "LENDER";
  token: string;
  requestId?: string;
}

export function SimulationCenter({ role, token, requestId = DEMO_REQUEST_ID }: SimulationCenterProps) {
  const sim = useSimulation(token, requestId);
  const [resetOpen, setResetOpen] = useState(false);
  const Content = role === "LENDER" ? LenderContent : ManufacturerContent;

  if (sim.loading && !sim.state) {
    return (
      <Content>
        <p className="text-muted-foreground">Loading simulation…</p>
      </Content>
    );
  }

  const state = sim.state;
  if (!state) {
    return (
      <Content>
        <p className="text-destructive">{sim.error ?? "Simulation unavailable."}</p>
      </Content>
    );
  }

  const latest = state.latest_event;
  const isHighRisk = isRiskAlert(state.confidence_score);

  const handleReset = async () => {
    setResetOpen(false);
    await sim.reset();
  };

  return (
    <Content className="space-y-6 pb-8">
      {/* Compact header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Simulation center</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {state.manufacturer_name}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {state.product_name} · {state.simulation_id}
          </p>
        </div>
        <span className="rounded-full border border-foreground/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {state.status}
        </span>
      </header>

      <p className="rounded-lg border border-lime/20 bg-lime/5 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-semibold text-ink">Lifecycle simulation</span> — steps update confidence gradually.
        Material changes also appear in{" "}
        <Link href="/lender/reassessments" className="font-semibold text-lime-deep underline">
          Reassessments
        </Link>
        {role === "LENDER" ? " for lender review." : "."}
      </p>

      {sim.error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
          {sim.error}{" "}
          <button type="button" className="font-semibold underline" onClick={() => sim.reload()}>Retry</button>
        </div>
      ) : null}

      {sim.lastReassessment && role === "LENDER" ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lime/30 bg-lime/10 px-4 py-3"
        >
          <p className="text-sm text-ink">
            New reassessment: confidence {sim.lastReassessment.previous_confidence}% → {sim.lastReassessment.new_confidence}%
          </p>
          <Link
            href={`/lender/reassessments/${sim.lastReassessment.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white"
          >
            Review now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      ) : null}

      {isHighRisk && state.status === "RUNNING" && role === "LENDER" ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm text-red-900">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>High risk — confidence {state.confidence_score}/100</span>
          </div>
          <Link
            href="/lender/reassessments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-900"
          >
            Reassessment queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/lender/opportunities/${requestId}/decision`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white"
          >
            Review request <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      ) : null}

      {/* Key metrics — role-specific */}
      {role === "LENDER" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PlatformMetricCard label="Confidence" value={state.confidence_score} subtext="/ 100" variant="lime" />
          <PlatformMetricCard label="Financing exposure" value={formatINRCompact(state.financing_exposure)} />
          <PlatformMetricCard label="Stage" value={state.current_stage.replace(/_/g, " ")} variant="white" />
          <PlatformMetricCard label="Risk" value={state.risk_band_label.split(" ")[0]} variant="dark" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <PlatformMetricCard label="Confidence" value={state.confidence_score} subtext="/ 100" variant="lime" />
          <PlatformMetricCard label="Progress" value={`${state.production_progress}%`} />
          <PlatformMetricCard label="Stage" value={state.current_stage.replace(/_/g, " ")} />
        </div>
      )}

      {/* Lifecycle */}
      <PhysicalGoodsLifecycleStepper currentStage={state.current_stage} progress={state.production_progress} variant="premium" compact />

      {/* Current event + confidence — single row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current event</p>
          <h2 className="mt-1 font-display text-xl font-semibold">
            {latest ? latest.event_type.replace(/_/g, " ") : "Ready to start"}
          </h2>
          {latest ? <p className="mt-1 text-sm text-muted-foreground">{latest.description}</p> : null}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Stat label="Progress" value={`${state.production_progress}%`} />
            <Stat label="Quantity" value={`${state.quantity_completed.toLocaleString()} / ${state.quantity_planned.toLocaleString()}`} />
            {state.delay_days > 0 ? <Stat label="Delay" value={`${state.delay_days}d`} warn /> : null}
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[1.25rem] border border-white/10 bg-ink p-5 lg:min-w-[200px]">
          <ConfidenceGauge score={state.confidence_score} previous={latest?.confidence_before} variant="dark" />
        </section>
      </div>

      {/* Lender-only: decision link */}
      {role === "LENDER" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-foreground/10 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Suggested exposure</p>
            <p className="font-display text-2xl font-semibold">
              {formatINRCompact(Math.round(state.funding_requested * (state.confidence_score / 100) * 0.7))}
            </p>
          </div>
          <Link
            href={`/lender/opportunities/${requestId}/decision`}
            className="inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-semibold text-ink hover:brightness-95"
          >
            Decision workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {/* Controls */}
      <section className="flex justify-center rounded-[1.25rem] border border-foreground/10 bg-white p-5">
        <SimulationControls
          state={state}
          loading={sim.actionLoading}
          onStart={sim.start}
          onNext={sim.next}
          onAuto={sim.enableAuto}
          onPause={sim.pause}
          onReset={() => setResetOpen(true)}
        />
      </section>

      {state.status === "COMPLETED" ? (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.25rem] border border-lime/30 bg-lime/5 p-6 text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Complete</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {state.starting_confidence} → {state.confidence_score} confidence · {state.events.length} events
          </p>
        </motion.section>
      ) : null}

      <EventGeneratedModal
        event={sim.lastEvent}
        open={sim.showEventModal}
        onClose={() => sim.setShowEventModal(false)}
        role={role}
      />
      <SimulationResetDialog open={resetOpen} onConfirm={handleReset} onCancel={() => setResetOpen(false)} />
    </Content>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-semibold ${warn ? "text-amber-700" : ""}`}>{value}</p>
    </div>
  );
}
