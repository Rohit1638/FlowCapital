"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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
}

export function PhysicalGoodsLifecycleStepper({
  currentStage,
  progress,
  className,
}: PhysicalGoodsLifecycleStepperProps) {
  const current = normalizeLifecycleStage(currentStage);
  const currentIdx = LIFECYCLE_TRACKER_STAGES.findIndex((s) => s.code === current);
  const displayProgress = progress ?? LIFECYCLE_TRACKER_STAGES.find((s) => s.code === current)?.progressPct ?? 0;
  const currentLabel = LIFECYCLE_TRACKER_STAGES.find((s) => s.code === current)?.label ?? current.replace(/_/g, " ");
  const [hovered, setHovered] = useState<string | null>(null);

  const railProgress = currentIdx <= 0 ? 0 : (currentIdx / (LIFECYCLE_TRACKER_STAGES.length - 1)) * 100;

  return (
    <section className={cn("rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-8", className)}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Physical Goods Lifecycle</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">Live production tracking</h3>
        </div>
        <div className="rounded-xl border border-cyan/30 bg-cyan/5 px-5 py-3 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current stage</p>
          <p className="font-display text-xl font-semibold text-ink">{currentLabel}</p>
          <p className="mt-0.5 text-sm font-semibold text-cyan-700">{displayProgress}% complete</p>
        </div>
      </div>

      {/* Desktop horizontal rail */}
      <div className="hidden overflow-x-auto md:block">
        <div className="relative min-w-[720px] px-2 pb-4">
          <div className="absolute left-8 right-8 top-[22px] h-1 rounded-full bg-foreground/10" />
          <div
            className="absolute left-8 top-[22px] h-1 rounded-full bg-gradient-to-r from-lime to-cyan-500 transition-all duration-700"
            style={{ width: `calc((100% - 4rem) * ${railProgress / 100})` }}
          />
          <div className="relative flex justify-between">
            {LIFECYCLE_TRACKER_STAGES.map((stage) => {
              const state = stageState(stage.code, current);
              const isHovered = hovered === stage.code;
              return (
                <div
                  key={stage.code}
                  className="relative flex w-[12%] flex-col items-center"
                  onMouseEnter={() => setHovered(stage.code)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className={cn(
                      "relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-500",
                      state === "completed" && "border-lime bg-lime/20 text-lime-deep",
                      state === "active" && "border-cyan-500 bg-white text-cyan-600 shadow-[0_0_0_4px_rgba(34,211,238,0.15)] animate-pulse-slow",
                      state === "upcoming" && "border-foreground/15 bg-background text-muted-foreground",
                    )}
                  >
                    {state === "active" ? <span className="h-3 w-3 rounded-full bg-cyan-500" /> : null}
                    {state === "completed" ? <Check className="h-4 w-4" /> : null}
                    {state === "upcoming" ? <span className="h-2 w-2 rounded-full bg-foreground/25" /> : null}
                  </div>
                  <p
                    className={cn(
                      "mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em]",
                      state === "active" ? "text-ink" : state === "completed" ? "text-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {stage.label}
                  </p>
                  {state === "active" ? (
                    <span className="mt-1 rounded-full bg-cyan/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-800">
                      Current
                    </span>
                  ) : null}
                  {isHovered ? (
                    <div className="absolute top-full z-20 mt-3 w-44 rounded-xl border border-foreground/10 bg-ink p-3 text-left text-white shadow-lg">
                      <p className="text-xs font-semibold uppercase">{stage.label}</p>
                      <p className="mt-2 text-[11px] text-white/70">Status: {state}</p>
                      <p className="text-[11px] text-white/70">Progress: {stage.progressPct}%</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile vertical */}
      <div className="space-y-1 md:hidden">
        {LIFECYCLE_TRACKER_STAGES.map((stage, i) => {
          const state = stageState(stage.code, current);
          return (
            <div key={stage.code} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                    state === "completed" && "border-lime bg-lime/20 text-lime-deep",
                    state === "active" && "border-cyan-500 bg-cyan/10 text-cyan-700",
                    state === "upcoming" && "border-foreground/15 text-muted-foreground",
                  )}
                >
                  {state === "completed" ? <Check className="h-3.5 w-3.5" /> : state === "active" ? <span className="h-2 w-2 rounded-full bg-cyan-500" /> : null}
                </div>
                {i < LIFECYCLE_TRACKER_STAGES.length - 1 ? <div className={cn("mt-1 h-8 w-px", state === "completed" ? "bg-lime" : "bg-foreground/10")} /> : null}
              </div>
              <div className="pb-4 pt-1">
                <p className="text-sm font-semibold">{stage.label}</p>
                <p className="text-xs text-muted-foreground">
                  {stage.progressPct}% · {state === "active" ? "Current stage" : state}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
