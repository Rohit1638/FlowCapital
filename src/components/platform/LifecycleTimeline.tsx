"use client";

import type { ProductionStage, WorkflowEvent } from "@/types/platform";
import { cn } from "@/lib/utils";

export function LifecycleTimeline({ stages, events }: { stages: ProductionStage[]; events: WorkflowEvent[] }) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-foreground/10" />
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.id} className="relative pl-10">
              <div
                className={cn(
                  "absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-white",
                  stage.status === "COMPLETED" && "bg-lime",
                  stage.status === "IN_PROGRESS" && "bg-ink ring-4 ring-lime/30",
                  stage.status === "PENDING" && "bg-muted",
                  stage.status === "DELAYED" && "bg-destructive",
                )}
              />
              <div className="rounded-2xl border border-foreground/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{stage.stage_name}</p>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{stage.status.replace(/_/g, " ")}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-lime" style={{ width: `${stage.progress_pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {events.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent workflow events</p>
          <div className="space-y-2">
            {events.slice(-5).reverse().map((event) => (
              <div key={event.event_code} className="rounded-xl border border-foreground/10 bg-surface-2 px-4 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{event.event_type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
