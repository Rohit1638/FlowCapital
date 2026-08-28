"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PayloadViewer } from "@/components/integration/PayloadViewer";
import { ProcessingPipeline } from "@/components/integration/ProcessingPipeline";
import { formatDateTime } from "@/lib/format";
import { useIntegrationEvents } from "@/lib/integration/store";
import { pageTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function EventDetail({ id }: { id: string }) {
  const events = useIntegrationEvents();
  const [ready, setReady] = useState(false);
  const event = events.find((item) => item.id === id);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading event trace…</p>;
  }

  if (!event) {
    return (
      <div className="rounded-[1.6rem] border border-foreground/10 bg-white p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Event Intelligence</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Event not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This signal is not in the current demo event store.</p>
        <Link href="/events" className="mt-6 inline-flex text-sm font-semibold underline">
          Return to the event stream
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-6">
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event Intelligence
        </Link>
        <p className="mt-4 font-mono text-sm tracking-wide text-ink/50">{event.id}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {event.eventType.replaceAll("_", " ")}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            {event.status.replaceAll("_", " ")}
          </span>
          <span className="rounded-full bg-lime px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
            {event.confidence}% · {event.confidenceLevel}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink/60">
            {event.severity}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Source", event.sourceSystem],
          ["Asset", event.assetId ?? "Unmatched"],
          ["Received", formatDateTime(event.receivedAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.4rem] border border-foreground/10 bg-white px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-medium">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Processing pipeline</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">System trace</h2>
          <div className="mt-5">
            <ProcessingPipeline event={event} />
          </div>
        </section>
        <section className="rounded-[1.6rem] bg-ink p-5 text-white md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">Processing explanation</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Why this result</h2>
          <p className="mt-4 text-sm leading-7 text-white/70">{event.explanation}</p>
          {event.errorMessage ? (
            <p className={cn("mt-4 rounded-2xl bg-white/8 px-4 py-3 text-sm", event.status === "REJECTED" && "text-[#ffb4ab]")}>
              {event.errorMessage}
            </p>
          ) : null}
        </section>
      </div>

      <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Raw vs normalized
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">How FlowCapital reads different systems</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          External payloads stay source-shaped. The engine converts them into one canonical event before matching a twin.
        </p>
        <div className="mt-5">
          <PayloadViewer event={event} />
        </div>
      </section>
    </motion.div>
  );
}

export function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EventDetail id={id} />;
}
