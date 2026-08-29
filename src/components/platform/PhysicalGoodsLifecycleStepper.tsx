"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import {
  LIFECYCLE_TRACKER_STAGES,
  normalizeLifecycleStage,
  stageState,
} from "@/lib/platform/lifecycle-stages";
import { cn } from "@/lib/utils";

interface PhysicalGoodsLifecycleStepperProps {
  currentStage: string;
  progress?: number;
  className?: string;
  compact?: boolean;
  variant?: "default" | "premium";
}

export function PhysicalGoodsLifecycleStepper({
  currentStage,
  progress,
  className,
  compact = false,
  variant = "default",
}: PhysicalGoodsLifecycleStepperProps) {
  const current = normalizeLifecycleStage(currentStage);
  const currentIdx = LIFECYCLE_TRACKER_STAGES.findIndex((s) => s.code === current);
  const displayProgress = progress ?? LIFECYCLE_TRACKER_STAGES.find((s) => s.code === current)?.progressPct ?? 0;
  const currentLabel = LIFECYCLE_TRACKER_STAGES.find((s) => s.code === current)?.label ?? current.replace(/_/g, " ");
  const isPremium = variant === "premium";

  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-foreground/10 bg-white",
        compact ? "p-4 md:p-5" : "p-6 md:p-8",
        isPremium && "overflow-hidden bg-gradient-to-br from-white to-surface-2/30",
        className,
      )}
    >
      <div className={cn("flex flex-wrap items-center justify-between gap-3", isPremium ? "mb-5" : "mb-6")}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Lifecycle</p>
          {!compact || isPremium ? (
            <h3 className="mt-0.5 font-display text-lg font-semibold text-ink">Live production tracking</h3>
          ) : null}
        </div>
        <div className="rounded-xl border border-foreground/10 bg-ink px-4 py-2.5 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-white/50">Current stage</p>
          <p className="text-sm font-semibold text-white">{currentLabel}</p>
          <p className="text-xs font-medium text-lime">{displayProgress}% complete</p>
        </div>
      </div>

      {/* Premium horizontal stepper */}
      <div className="overflow-x-auto pb-1">
        <div className="relative min-w-[560px]">
          {/* Background rail */}
          <div className="absolute left-0 right-0 top-[28px] mx-4 h-[3px] rounded-full bg-foreground/8" />
          <motion.div
            className="absolute left-4 top-[28px] h-[3px] rounded-full bg-gradient-to-r from-lime via-lime to-lime/40"
            initial={false}
            animate={{
              width: currentIdx <= 0 ? "0%" : `calc((100% - 2rem) * ${currentIdx / (LIFECYCLE_TRACKER_STAGES.length - 1)})`,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />

          <div className="relative flex justify-between px-2">
            {LIFECYCLE_TRACKER_STAGES.map((stage, i) => {
              const st = stageState(stage.code, current);
              return (
                <motion.div
                  key={stage.code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex w-[13%] flex-col items-center"
                >
                  <div
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300",
                      st === "completed" && "border-lime/60 bg-lime/10 shadow-sm",
                      st === "active" && "border-lime bg-white shadow-[0_4px_20px_-4px_rgba(163,230,53,0.45)]",
                      st === "upcoming" && "border-foreground/10 bg-background/80",
                    )}
                  >
                    {st === "completed" ? (
                      <Check className="h-5 w-5 text-lime-deep" strokeWidth={2.5} />
                    ) : st === "active" ? (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="h-3 w-3 rounded-full bg-lime"
                      />
                    ) : (
                      <Circle className="h-3 w-3 text-foreground/20" fill="currentColor" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-2.5 text-center text-[9px] font-bold uppercase leading-tight tracking-[0.08em] md:text-[10px]",
                      st === "active" ? "text-ink" : st === "completed" ? "text-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {stage.label}
                  </p>
                  {st === "active" ? (
                    <span className="mt-1 rounded-full bg-lime/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-lime-deep">
                      Current
                    </span>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile vertical */}
      <div className="mt-5 space-y-0 md:hidden">
        {LIFECYCLE_TRACKER_STAGES.map((stage, i) => {
          const st = stageState(stage.code, current);
          return (
            <div key={stage.code} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border-2",
                    st === "completed" && "border-lime bg-lime/10",
                    st === "active" && "border-lime bg-white shadow-sm",
                    st === "upcoming" && "border-foreground/10",
                  )}
                >
                  {st === "completed" ? <Check className="h-3.5 w-3.5 text-lime-deep" /> : st === "active" ? <span className="h-2 w-2 rounded-full bg-lime" /> : null}
                </div>
                {i < LIFECYCLE_TRACKER_STAGES.length - 1 ? <div className={cn("h-5 w-px", st === "completed" ? "bg-lime/50" : "bg-foreground/10")} /> : null}
              </div>
              <div className="pb-3 pt-0.5">
                <p className="text-sm font-medium">{stage.label}</p>
                {st === "active" ? <p className="text-xs text-lime-deep">{displayProgress}% · Current</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
