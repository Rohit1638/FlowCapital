"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isRiskAlert } from "@/lib/platform/risk-constants";
import { bandLabelForConfidence } from "@/lib/platform/simulation-config";
import type { SimulationEvent } from "@/types/simulation";

export function EventGeneratedModal({
  event,
  open,
  onClose,
  role,
}: {
  event: SimulationEvent | null;
  open: boolean;
  onClose: () => void;
  role: "MANUFACTURER" | "LENDER";
}) {
  if (!event || !open) return null;
  const isHighRisk = isRiskAlert(event.confidence_after);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-[1.375rem] border border-foreground/10 bg-white p-7 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Event generated</p>
              <h3 className="mt-1 font-display text-2xl font-semibold">{event.event_type.replace(/_/g, " ")}</h3>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-surface-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-foreground/8 bg-surface-2 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Production progress</p>
              <p className="font-display text-xl font-semibold">{event.production_progress}%</p>
            </div>
            {event.delay_days > 0 ? (
              <div className="rounded-xl border border-foreground/8 bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Delay</p>
                <p className="font-display text-xl font-semibold">{event.delay_days} days</p>
              </div>
            ) : null}
            <div className="rounded-xl border border-foreground/8 bg-surface-2 p-3 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Confidence</p>
              <p className="font-display text-xl font-semibold">
                {event.confidence_before} → {event.confidence_after}
              </p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{bandLabelForConfidence(event.confidence_after)}</p>
            </div>
          </div>

          {event.financial_impact?.summary ? (
            <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/5 p-4">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Financial impact</p>
              <p className="mt-1 text-sm">{event.financial_impact.summary}</p>
            </div>
          ) : null}

          {isHighRisk ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">High risk event</p>
              <p className="mt-1 text-xs text-red-700">
                {role === "LENDER"
                  ? "Review financing exposure and production evidence before making a decision."
                  : "Operational delay may require updated evidence to restore confidence."}
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <Button variant="lime" className="w-full" onClick={onClose}>
              Continue
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
