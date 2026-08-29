"use client";

import { motion } from "framer-motion";
import { isRiskAlert, RISK_ALERT_CONFIDENCE_THRESHOLD } from "@/lib/platform/risk-constants";
import { bandLabelForConfidence } from "@/lib/platform/simulation-config";
import { cn } from "@/lib/utils";

export function ConfidenceGauge({
  score,
  previous,
  variant = "light",
}: {
  score: number;
  previous?: number;
  variant?: "light" | "inline" | "dark";
}) {
  const band = bandLabelForConfidence(score);
  const isHighRisk = isRiskAlert(score);
  const isModerate = score >= RISK_ALERT_CONFIDENCE_THRESHOLD && score < 70;
  const strokeClass = isHighRisk ? "text-red-400" : isModerate ? "text-amber-400" : "text-lime";
  const isDark = variant === "dark";

  return (
    <div className={cn("flex flex-col items-center", variant === "inline" && "flex-row gap-5")}>
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className={isDark ? "text-white/10" : "text-foreground/10"}
          />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={strokeClass}
            stroke="currentColor"
            initial={{ strokeDasharray: "0 327" }}
            animate={{ strokeDasharray: `${(score / 100) * 327} 327` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </svg>
        <div className="text-center">
          <motion.p
            key={score}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("font-display text-3xl font-semibold", isDark ? "text-white" : "text-ink")}
          >
            {score}
          </motion.p>
          <p className={cn("text-[10px] font-semibold uppercase tracking-wide", isDark ? "text-white/45" : "text-muted-foreground")}>
            / 100
          </p>
        </div>
      </div>
      <div className={cn("text-center", variant === "inline" && "text-left")}>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.12em]",
            isDark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {band}
        </p>
        {previous !== undefined && previous !== score ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("mt-0.5 text-xs", isDark ? "text-white/50" : "text-muted-foreground")}
          >
            {previous} → {score}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}
