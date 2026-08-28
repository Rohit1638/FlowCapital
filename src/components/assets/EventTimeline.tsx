"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { EventDomain, LifecycleEvent } from "@/types/event";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileText,
  Package,
  Shield,
  Truck,
  Wallet,
} from "lucide-react";

const filters: { id: "ALL" | EventDomain; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "physical", label: "Physical" },
  { id: "financial", label: "Financial" },
  { id: "risk", label: "Risk" },
  { id: "verification", label: "Verification" },
];

const icons = {
  shipment: Truck,
  warehouse: Package,
  invoice: FileText,
  production: Factory,
  risk: Shield,
  financing: Wallet,
  procurement: ClipboardCheck,
  verification: CheckCircle2,
  physical: Factory,
  contract: FileText,
};

export function EventTimeline({ events }: { events: LifecycleEvent[] }) {
  const [domain, setDomain] = useState<"ALL" | EventDomain>("ALL");
  const filtered = useMemo(
    () => (domain === "ALL" ? events : events.filter((event) => event.domain === domain)),
    [events, domain],
  );

  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Journey</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Asset timeline</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setDomain(filter.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                domain === filter.id ? "bg-ink text-white" : "bg-secondary text-ink/70",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-1">
        {filtered.map((event, index) => {
          const Icon = icons[event.category];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
              className="flex items-start gap-4"
            >
              <div className="flex w-10 shrink-0 flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-lime">
                  <Icon className="h-4 w-4" />
                </div>
                {index < filtered.length - 1 ? <div className="mt-1 h-8 w-px bg-foreground/10" /> : null}
              </div>
              <div className="min-w-0 flex-1 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{event.title}</h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {event.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p>
                <p className="mt-2 text-xs text-ink/45">
                  {event.source} · {formatDateTime(event.timestamp)}
                </p>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events in this filter.</p>
        ) : null}
      </div>
    </section>
  );
}
