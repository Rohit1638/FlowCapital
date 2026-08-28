"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrencyINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  format = "inr",
  className,
}: {
  value: number;
  format?: "inr" | "score" | "pct";
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const origin = current.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 700);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = origin + (value - origin) * eased;
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (format === "score") return <span className={className}>{Math.round(display)}</span>;
  if (format === "pct") return <span className={className}>{Math.round(display)}%</span>;
  return <span className={className}>{formatCurrencyINR(display, 2)}</span>;
}

export function Delta({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (!value) return <span className="text-xs text-muted-foreground">No change</span>;
  const positive = value > 0;
  return (
    <span className={cn("text-xs font-semibold", positive ? "text-[#5b8f24]" : "text-[#b5473c]")}>
      {positive ? "+" : ""}
      {suffix === "₹" ? formatCurrencyINR(value, 2) : `${value}${suffix}`}
    </span>
  );
}
