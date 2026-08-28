"use client";

import { motion } from "framer-motion";
import { ConflictBoard } from "@/components/integration/ConflictBoard";
import { EventMetrics } from "@/components/integration/EventMetrics";
import { EventSimulator } from "@/components/integration/EventSimulator";
import { EventStream } from "@/components/integration/EventStream";
import { PageHeader } from "@/components/shared/PageHeader";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { useConflicts, useIntegrationEvents } from "@/lib/integration/store";
import { pageTransition } from "@/lib/motion";

export function EventIntelligence() {
  const events = useIntegrationEvents();
  const conflicts = useConflicts();

  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Data & Events"
        title="Event Intelligence"
        description="Every asset movement becomes a trusted financial signal."
        meta={
          <div className="rounded-2xl border border-foreground/10 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Engine feed
            </p>
            <div className="mt-2">
              <LiveIndicator />
            </div>
          </div>
        }
      />
      <EventMetrics />
      <EventSimulator />
      <ConflictBoard conflicts={conflicts} />
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Live event stream
        </p>
        <EventStream events={events} />
      </section>
    </motion.div>
  );
}
