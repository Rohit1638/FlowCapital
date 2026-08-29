"use client";

import { motion } from "framer-motion";
import { formatINRCompact } from "@/lib/format";
import type { ExposureSnapshot } from "@/types/platform";
import { cn } from "@/lib/utils";

interface ExposureCapacityPanelProps {
  snapshot: ExposureSnapshot;
  variant?: "manufacturer" | "lender";
}

const STATUS_LABELS: Record<string, string> = {
  HEALTHY: "Healthy",
  MODERATE: "Monitor",
  HIGH_UTILIZATION: "High Utilization",
  CRITICAL: "Near Maximum",
  OVER_FINANCED: "Critical — Over-Financed",
};

export function ExposureCapacityPanel({ snapshot, variant = "manufacturer" }: ExposureCapacityPanelProps) {
  const utilization = snapshot.utilization_percentage;
  const isLender = variant === "lender";

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[1.25rem] border p-6 md:p-7",
        isLender
          ? "border-foreground/10 bg-gradient-to-br from-ink to-ink/95 text-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)]"
          : "border-foreground/10 bg-white text-ink",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", isLender ? "text-lime" : "text-muted-foreground")}>
            {variant === "manufacturer" ? "Capital capacity" : "Safe financing capacity"}
          </p>
          <h2 className={cn("mt-1 font-display text-xl font-semibold md:text-2xl", isLender ? "text-white" : "text-ink")}>
            {formatINRCompact(snapshot.remaining_available_capacity)} available
          </h2>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
            utilization > 95
              ? "border-red-400/60 bg-red-500/10 text-red-300"
              : utilization > 80
                ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                : isLender
                  ? "border-lime/50 bg-lime/10 text-lime"
                  : "border-lime/40 text-lime-deep",
          )}
        >
          {STATUS_LABELS[snapshot.risk_status] ?? snapshot.risk_status}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs">
          <span className={isLender ? "text-white/70" : "text-muted-foreground"}>Utilization</span>
          <span className={cn("font-semibold", isLender ? "text-white" : "text-ink")}>{utilization}%</span>
        </div>
        <div className={cn("h-2 overflow-hidden rounded-full", isLender ? "bg-white/15" : "bg-muted")}>
          <div
            className={cn("h-full rounded-full transition-all duration-700", utilization > 95 ? "bg-red-500" : utilization > 80 ? "bg-amber-400" : "bg-lime")}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cell label="Safe capacity" value={formatINRCompact(snapshot.maximum_safe_capacity)} isLender={isLender} highlight />
        <Cell label="Active exposure" value={formatINRCompact(snapshot.active_exposure)} isLender={isLender} />
        <Cell label="Reserved" value={formatINRCompact(snapshot.reserved_exposure)} isLender={isLender} />
        <Cell label="Available" value={formatINRCompact(snapshot.remaining_available_capacity)} isLender={isLender} highlight />
      </div>

      {variant === "lender" ? (
        <p className="mt-4 text-sm text-white/75">
          Your proposed offer must fit within the currently available verified capacity (
          {formatINRCompact(snapshot.remaining_available_capacity)}).
        </p>
      ) : null}

      {snapshot.capacity_reasons?.length ? (
        <div className="mt-4 space-y-1">
          <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isLender ? "text-white/60" : "text-muted-foreground")}>
            Why is available financing lower?
          </p>
          <ul className={cn("list-inside list-disc text-sm", isLender ? "text-white/75" : "text-muted-foreground")}>
            {snapshot.capacity_reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </motion.section>
  );
}

function Cell({ label, value, isLender, highlight }: { label: string; value: string; isLender?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isLender ? "text-white/60" : "text-muted-foreground")}>{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-lg font-semibold",
          highlight ? (isLender ? "text-lime" : "text-lime-deep") : isLender ? "text-white" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}
