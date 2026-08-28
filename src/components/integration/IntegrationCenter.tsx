"use client";

import { motion } from "framer-motion";
import { ConnectorGrid, IntegrationArchitecture } from "@/components/integration/ConnectorGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { pageTransition } from "@/lib/motion";

export function IntegrationCenter() {
  return (
    <motion.div initial="hidden" animate="visible" variants={pageTransition} className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Data & Events"
        title="Integration Center"
        description="Every supply-chain signal enters one intelligence layer."
        meta={
          <div className="rounded-2xl border border-foreground/10 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Simulated live
            </p>
            <div className="mt-2">
              <LiveIndicator />
            </div>
          </div>
        }
      />
      <IntegrationArchitecture />
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Connectors
        </p>
        <ConnectorGrid />
      </div>
    </motion.div>
  );
}
