"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Factory,
  Network,
  Package,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import type { EventSource, IntegrationEvent } from "@/types/integration";
import { formatRelativeTime } from "@/lib/format";
import { useIntegrationEvents } from "@/lib/integration/store";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const icons: Record<EventSource, typeof Factory> = {
  ERP: Network,
  PRODUCTION: Factory,
  WAREHOUSE: Package,
  LOGISTICS: Truck,
  FINANCE: Wallet,
  VERIFICATION: ShieldCheck,
};

export function EventFeed() {
  const events = useIntegrationEvents().slice(0, 6);
  return (
    <section className="h-full rounded-[1.6rem] bg-ink p-5 text-white md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Section 05
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Live Event Stream</h2>
        </div>
        <Link href="/events" className="text-xs font-semibold uppercase tracking-wide text-lime hover:text-white">
          Event Intelligence
        </Link>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-5 flex flex-col gap-2.5"
      >
        {events.map((event, index) => (
          <IntegrationFeedRow key={event.id} event={event} index={index} />
        ))}
      </motion.div>
    </section>
  );
}

function IntegrationFeedRow({ event, index }: { event: IntegrationEvent; index: number }) {
  const Icon =
    event.status === "CONFLICT_DETECTED" || event.status === "REJECTED"
      ? AlertTriangle
      : event.status === "APPLIED"
        ? CheckCircle2
        : icons[event.source];

  return (
    <motion.div variants={staggerItem} custom={index}>
      <Link
        href={`/events/${event.id}`}
        className="flex gap-3 rounded-2xl border border-white/8 bg-white/4 px-3.5 py-3 transition-colors hover:bg-white/8"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/6">
          <Icon className="h-4 w-4 text-lime" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-white">{event.eventType.replaceAll("_", " ")}</p>
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                event.status === "APPLIED" && "bg-lime",
                event.status === "CONFLICT_DETECTED" && "bg-[#f0c75e]",
                event.status === "REJECTED" && "bg-[#ff6b5a]",
                event.status === "DUPLICATE" && "bg-white/50",
              )}
            />
          </div>
          <p className="mt-1 text-xs text-white/45">
            {event.assetId ?? "Unmatched"} · {event.status.replaceAll("_", " ")} · {formatRelativeTime(event.receivedAt)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
