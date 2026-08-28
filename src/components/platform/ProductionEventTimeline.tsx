"use client";

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
  if (type.includes("QUANTITY")) {
    if (event.description?.includes("→") || event.description?.includes("1000")) {
      return `${event.description} Potential impact: funding requirement may change.`;
    }
    return "Potential impact: funding requirement or collateral alignment may change.";
  }
  if (type.includes("DELAY")) {
    return "Potential impact: expected repayment timeline may shift.";
  }
  if (type.includes("PRODUCTION") && event.description?.includes("%")) {
    return "Production progress update — supports ongoing exposure monitoring.";
  }
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
    <section className={cn("rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7", className)}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Production event history</p>
        <p className="mt-1 text-sm text-muted-foreground">Recent operational changes reported by the manufacturer.</p>
      </div>
      <div className="mt-6 space-y-0">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No production events recorded yet.</p>
        ) : (
          sorted.map((event, idx) => {
            const Icon = EVENT_ICONS[event.event_type.toUpperCase()] ?? RefreshCw;
            const impact = eventImpact(event);
            const isWarning = event.severity === "warning" || event.event_type.includes("MISMATCH") || event.event_type.includes("DELAY");
            return (
              <div key={event.event_code ?? `${event.event_type}-${idx}`} className="relative flex gap-4 pb-6 last:pb-0">
                {idx < sorted.length - 1 ? (
                  <span className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-foreground/10" />
                ) : null}
                <div
                  className={cn(
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    isWarning ? "border-amber-500/40 bg-amber-50 text-amber-700" : "border-cyan/30 bg-cyan/5 text-cyan-700",
                  )}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatEventDate(event.timestamp)}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink">
                      · {event.event_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground/90">{event.description}</p>
                  {impact ? (
                    <p className="mt-2 rounded-lg border border-foreground/8 bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wide text-ink/70">Financial impact · </span>
                      {impact}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
