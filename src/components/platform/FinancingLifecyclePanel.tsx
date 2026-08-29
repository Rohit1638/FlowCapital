"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancingLifecycleView, InstrumentSuitability } from "@/types/platform";

function formatInstrument(code: string | undefined | null) {
  if (!code) return "—";
  return code.replace(/_/g, " ");
}

interface FinancingLifecyclePanelProps {
  lifecycle: FinancingLifecycleView;
  requestId: string;
  className?: string;
}

export function FinancingLifecyclePanel({ lifecycle, requestId, className }: FinancingLifecyclePanelProps) {
  const suitability = lifecycle.suitability as InstrumentSuitability | undefined;
  const currentPhaseIdx = lifecycle.lifecycle_flow.findIndex((p) => p.stages.includes(lifecycle.current_stage));
  const pendingReview = lifecycle.pending_transition_id != null;

  return (
    <section className={cn("rounded-[1.25rem] border border-foreground/10 bg-gradient-to-br from-white to-surface-2/40 p-6 md:p-8", className)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Financing Lifecycle</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Smart instrument intelligence</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            As physical assets move through production, the system recommends the most suitable financing structure.
          </p>
        </div>
        {pendingReview ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
            <Clock className="h-3.5 w-3.5" />
            Awaiting lender review
          </span>
        ) : null}
      </div>

      {/* Lifecycle flow visualization */}
      <div className="relative mb-8 overflow-x-auto pb-2">
        <div className="flex min-w-[640px] items-start justify-between gap-2">
          {lifecycle.lifecycle_flow.map((phase, i) => {
            const isCurrent = i === currentPhaseIdx;
            const isPast = currentPhaseIdx > i;
            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-1 flex-col items-center text-center"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all",
                    isPast && "border-lime/50 bg-lime/10",
                    isCurrent && "border-lime bg-white shadow-[0_4px_20px_-4px_rgba(163,230,53,0.45)]",
                    !isPast && !isCurrent && "border-foreground/10 bg-background/80",
                  )}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-5 w-5 text-lime-deep" />
                  ) : isCurrent ? (
                    <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} className="h-2.5 w-2.5 rounded-full bg-lime" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-foreground/15" />
                  )}
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-foreground/80">{phase.phase}</p>
                <p className="mt-1 text-[9px] font-medium text-muted-foreground">{formatInstrument(phase.instrument)}</p>
                {isCurrent ? (
                  <span className="mt-1 rounded-full bg-lime/20 px-2 py-0.5 text-[8px] font-bold uppercase text-lime-deep">Current</span>
                ) : null}
                {i < lifecycle.lifecycle_flow.length - 1 ? (
                  <ArrowRight className="absolute hidden text-foreground/20 lg:block" style={{ left: `${(i + 1) * 20 - 2}%`, top: "1.25rem" }} />
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Current business stage" value={lifecycle.current_stage_display} />
        <StatusCard label="Current financing" value={formatInstrument(lifecycle.current_instrument)} />
        <StatusCard
          label="System recommendation"
          value={formatInstrument(lifecycle.recommended_instrument)}
          highlight={lifecycle.current_instrument !== lifecycle.recommended_instrument}
        />
        <StatusCard label="Suitability" value={lifecycle.suitability_score != null ? `${lifecycle.suitability_score}%` : "—"} />
      </div>

      {lifecycle.transition_reason ? (
        <div className="mt-4 rounded-xl border border-foreground/10 bg-white/80 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-ink">Why this recommendation</p>
          <p className="mt-1">{lifecycle.transition_reason}</p>
        </div>
      ) : null}

      {suitability?.blocking_reasons?.length ? (
        <ul className="mt-3 space-y-1 text-sm text-amber-800">
          {suitability.blocking_reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/manufacturer/financing-lifecycle/${requestId}`}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          View full lifecycle
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function StatusCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-foreground/10 bg-white p-4", highlight && "ring-2 ring-lime/40")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold capitalize">{value}</p>
    </div>
  );
}
