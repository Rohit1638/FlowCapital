"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EventProcessingStatus, EventSource, IntegrationEvent } from "@/types/integration";
import { EVENT_SOURCES } from "@/types/integration";
import { formatRelativeTime } from "@/lib/format";
import { SOURCE_LABELS } from "@/lib/integration/connectors";
import { cn } from "@/lib/utils";

const statusClass: Record<EventProcessingStatus, string> = {
  APPLIED: "bg-lime text-ink",
  CONFLICT_DETECTED: "bg-ink text-lime",
  REJECTED: "bg-[#d4483a] text-white",
  DUPLICATE: "bg-[#f0e6c8] text-ink",
  FAILED: "bg-[#d4483a] text-white",
  RECEIVED: "bg-secondary text-ink",
  NORMALIZED: "bg-secondary text-ink",
  VALIDATED: "bg-secondary text-ink",
  RECONCILING: "bg-secondary text-ink",
};

export function EventStream({ events }: { events: IntegrationEvent[] }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<EventSource | "ALL">("ALL");
  const [status, setStatus] = useState<EventProcessingStatus | "ALL">("ALL");
  const [asset, setAsset] = useState("ALL");

  const assets = useMemo(
    () => Array.from(new Set(events.map((item) => item.assetId).filter((id): id is string => !!id))),
    [events],
  );

  const filtered = events.filter((event) => {
    if (source !== "ALL" && event.source !== source) return false;
    if (status !== "ALL" && event.status !== status) return false;
    if (asset !== "ALL" && event.assetId !== asset) return false;
    const hay = `${event.eventType} ${event.assetId ?? ""} ${event.sourceSystem}`.toLowerCase();
    if (query.trim() && !hay.includes(query.trim().toLowerCase())) return false;
    return true;
  });

  const selectClass =
    "h-10 rounded-full border border-foreground/12 bg-white px-3 text-sm outline-none";

  return (
    <div>
      <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search type, asset, source"
          aria-label="Search events"
          className="h-10 rounded-full border border-foreground/12 bg-white px-4 text-sm"
        />
        <select className={selectClass} value={source} onChange={(e) => setSource(e.target.value as EventSource | "ALL")} aria-label="Filter by source">
          <option value="ALL">All sources</option>
          {EVENT_SOURCES.map((item) => (
            <option key={item} value={item}>
              {SOURCE_LABELS[item]}
            </option>
          ))}
        </select>
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as EventProcessingStatus | "ALL")} aria-label="Filter by status">
          <option value="ALL">All statuses</option>
          <option value="APPLIED">Applied</option>
          <option value="CONFLICT_DETECTED">Conflict</option>
          <option value="REJECTED">Rejected</option>
          <option value="DUPLICATE">Duplicate</option>
        </select>
        <select className={selectClass} value={asset} onChange={(e) => setAsset(e.target.value)} aria-label="Filter by asset">
          <option value="ALL">All assets</option>
          {assets.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-white">
        {filtered.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="grid gap-2 border-b border-foreground/8 px-5 py-4 last:border-b-0 hover:bg-[#f4f4f0] md:grid-cols-[1.1fr_1.4fr_0.8fr_0.9fr_0.6fr_0.7fr] md:items-center"
          >
            <p className="text-sm font-medium">{event.sourceSystem}</p>
            <p className="font-mono text-xs">{event.eventType}</p>
            <p className="font-mono text-xs">{event.assetId ?? "—"}</p>
            <span className={cn("w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase", statusClass[event.status])}>
              {event.status.replaceAll("_", " ")}
            </span>
            <p className="text-sm">{event.confidence}% · {event.severity}</p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(event.receivedAt)}</p>
          </Link>
        ))}
        {filtered.length === 0 ? <p className="px-5 py-8 text-sm text-muted-foreground">No events match.</p> : null}
      </div>
    </div>
  );
}
