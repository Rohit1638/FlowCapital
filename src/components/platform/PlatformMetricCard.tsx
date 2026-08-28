"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "dark" | "white" | "lime";

interface PlatformMetricCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  footnote?: string;
  variant?: Variant;
  badge?: string;
}

export function PlatformMetricCard({
  label,
  value,
  subtext,
  footnote,
  variant = "white",
  badge,
}: PlatformMetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex h-full min-h-[148px] flex-col justify-between rounded-[1.25rem] border p-6",
        variant === "dark" && "border-transparent bg-ink text-white",
        variant === "white" && "border-foreground/10 bg-white text-ink",
        variant === "lime" && "border-transparent bg-lime text-ink",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.16em]",
            variant === "dark" ? "text-white/55" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {badge ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              variant === "lime" ? "bg-ink/10 text-ink" : "bg-lime/20 text-ink",
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div>
        <p className="font-display text-3xl font-semibold tracking-tight md:text-[2rem]">{value}</p>
        {subtext ? (
          <p className={cn("mt-2 text-sm", variant === "dark" ? "text-white/65" : "text-muted-foreground")}>{subtext}</p>
        ) : null}
        {footnote ? (
          <p className={cn("mt-1 text-xs", variant === "dark" ? "text-white/45" : "text-muted-foreground")}>{footnote}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
