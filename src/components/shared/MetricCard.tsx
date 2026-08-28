"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatINRCompact, formatPercent, padCount } from "@/lib/format";
import { staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
  changePct: number;
  format?: "inr" | "count";
  variant?: "feature" | "light" | "dark" | "lime";
  footnote?: string;
}

function AnimatedValue({
  value,
  format,
}: {
  value: number;
  format: "inr" | "count";
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (format === "count") {
    return <>{padCount(Math.round(display))}</>;
  }

  return <>{formatINRCompact(display)}</>;
}

export function MetricCard({
  label,
  value,
  changePct,
  format = "inr",
  variant = "light",
  footnote,
}: MetricCardProps) {
  const positive = changePct >= 0;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex h-full flex-col justify-between rounded-[1.4rem] border p-5",
        variant === "feature" && "min-h-[220px] border-transparent bg-ink text-white",
        variant === "light" && "border-foreground/10 bg-white",
        variant === "dark" && "border-transparent bg-ink-2 text-white",
        variant === "lime" && "border-transparent bg-lime text-ink",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.16em]",
            variant === "feature" || variant === "dark" ? "text-white/55" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
            variant === "lime" ? "bg-ink text-lime" : positive ? "bg-lime text-ink" : "bg-white/10 text-white",
            variant === "light" && !positive && "bg-ink text-white",
            variant === "light" && positive && "bg-lime text-ink",
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {formatPercent(changePct)}
        </span>
      </div>
      <div>
        <p
          className={cn(
            "font-display tracking-tight",
            variant === "feature" ? "text-5xl font-bold md:text-6xl" : "text-3xl font-semibold",
            variant === "feature" && "text-lime",
          )}
        >
          <AnimatedValue value={value} format={format} />
        </p>
        {footnote ? (
          <p
            className={cn(
              "mt-2 text-sm",
              variant === "feature" || variant === "dark" ? "text-white/55" : "text-muted-foreground",
            )}
          >
            {footnote}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
