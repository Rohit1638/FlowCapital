"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Box,
  FileCheck,
  Package,
  RefreshCw,
  Truck,
  Wallet,
} from "lucide-react";
import type { WorkflowEvent } from "@/types/platform";
import { cn } from "@/lib/utils";

const EVENT_ICONS: Record<string, typeof Package> = {
  PO_SIGNED: FileCheck,
  PURCHASE_ORDER: FileCheck,
  RAW_MATERIAL: Box,
  RAW_MATERIAL_RECEIVED: Box,
  PRODUCTION_STARTED: RefreshCw,
  PRODUCTION_PROGRESS_UPDATED: RefreshCw,
  PRODUCTION_UPDATED: RefreshCw,
  QUANTITY_MISMATCH_DETECTED: AlertTriangle,
  QUANTITY_CHANGED: AlertTriangle,
  PRODUCTION_DELAY: AlertTriangle,
  FINISHED_GOODS: Package,
  SHIPPED: Truck,
  INVOICED: FileCheck,
  PAYMENT_RECEIVED: Wallet,
};

function formatEventDate(timestamp?: string): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase();
}

function eventImpact(event: WorkflowEvent): string | null {
  const type = event.event_type.toUpperCase();
  if (type.includes("DELAY")) return "Repayment timeline may shift";
  if (type.includes("QUANTITY")) return "Funding requirement may change";
  if (type.includes("PRODUCTION") && event.description?.includes("%")) return "Progress update";
  return null;
}

interface ProductionEventTimelineProps {
  events: WorkflowEvent[];
  className?: string;
}

export function ProductionEventTimeline({ events, className }: ProductionEventTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime(),
  );

  return (
    <section className={cn("rounded-[1.25rem] border border-foreground/10 bg-white p-5 md:p-6", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Production events</p>

      <div className="mt-4 space-y-3">
        {sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No events recorded yet.</p>
        ) : (
          sorted.map((event, idx) => {
            const Icon = EVENT_ICONS[event.event_type.toUpperCase()] ?? RefreshCw;
            const impact = eventImpact(event);
            const isWarning =
              event.severity === "warning" ||
              event.event_type.includes("MISMATCH") ||
              event.event_type.includes("DELAY");

            return (
              <motion.div
                key={event.event_code ?? `${event.event_type}-${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={cn(
                  "group flex gap-3 rounded-xl border border-foreground/8 p-3 transition hover:border-lime/30 hover:bg-surface-2/40",
                  idx === 0 && "border-lime/25 bg-lime/[0.04]",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isWarning ? "bg-amber-500/10 text-amber-700" : "bg-lime/15 text-lime-deep",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatEventDate(event.timestamp)}
                    </span>
                    <span className="text-xs font-semibold text-ink">{event.event_type.replace(/_/g, " ")}</span>
                    {impact ? (
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {impact}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-foreground/85">{event.description}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
