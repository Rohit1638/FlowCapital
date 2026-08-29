"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { formatINRCompact } from "@/lib/format";
import type { FinancingHealth } from "@/types/platform";
import { cn } from "@/lib/utils";

interface FinancingHealthPanelProps {
  health: FinancingHealth;
  requestId: string;
}

const IMPACT_COLORS: Record<string, string> = {
  NO_MATERIAL_IMPACT: "text-muted-foreground",
  LOW_IMPACT: "text-foreground",
  MODERATE_IMPACT: "text-amber-700",
  HIGH_IMPACT: "text-red-700",
  CRITICAL_IMPACT: "text-red-800",
};

export function FinancingHealthPanel({ health, requestId }: FinancingHealthPanelProps) {
  const last = health.last_reassessment;
  const confDown = last && last.confidence_change < 0;
  const confUp = last && last.confidence_change > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-8"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Financing health</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Live intelligence status</h2>
        </div>
        {last ? (
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", IMPACT_COLORS[last.impact_level] ?? "", "bg-muted/50")}>
            {last.impact_level.replace(/_/g, " ")}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Confidence" value={`${health.confidence_score}%`} trend={confDown ? "down" : confUp ? "up" : undefined} />
        <Metric label="Risk" value={health.risk_level} />
        <Metric label="Safe capacity" value={formatINRCompact(health.maximum_safe_capacity)} />
        <Metric label="Remaining" value={formatINRCompact(health.remaining_capacity)} highlight />
      </div>

      {health.last_change_summary ? (
        <div className="mt-4 rounded-xl border border-foreground/10 bg-surface-2/30 p-4 text-sm">
          <p className="font-semibold text-ink">Last change</p>
          <p className="mt-1 text-muted-foreground">{health.last_change_summary}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Next step: {health.next_recommended_action?.replace(/_/g, " ")}
          </p>
        </div>
      ) : null}

      <Link
        href="/manufacturer/simulator"
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lime-deep hover:underline"
      >
        Open simulation center
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.section>
  );
}

function Metric({ label, value, highlight, trend }: { label: string; value: string; highlight?: boolean; trend?: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-foreground/8 bg-background/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className={cn("font-display text-xl font-semibold", highlight ? "text-lime-deep" : "text-ink")}>{value}</p>
        {trend === "down" ? <TrendingDown className="h-4 w-4 text-red-500" /> : null}
        {trend === "up" ? <TrendingUp className="h-4 w-4 text-lime-deep" /> : null}
      </div>
    </div>
  );
}
