"use client";

import { motion } from "framer-motion";
import type { SimulationEvent } from "@/types/simulation";
import { cn } from "@/lib/utils";

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function SimulationTimeline({ events }: { events: SimulationEvent[] }) {
  const sorted = [...events].reverse();

  if (sorted.length === 0) return null;

  return (
    <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent events</p>
      <div className="mt-3 space-y-2">
        {sorted.slice(0, 4).map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-foreground/8 px-3 py-2.5",
              idx === 0 && "border-lime/25 bg-lime/[0.04]",
            )}
          >
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{formatTime(event.timestamp)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{event.event_type.replace(/_/g, " ")}</p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {event.confidence_before}→{event.confidence_after}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
