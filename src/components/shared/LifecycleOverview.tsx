"use client";

import { motion } from "framer-motion";
import type { LifecycleAggregate } from "@/types/asset";
import { LifecycleStage } from "@/components/shared/LifecycleStage";
import { staggerContainer, staggerItem } from "@/lib/motion";

export function LifecycleOverview({ stages }: { stages: LifecycleAggregate[] }) {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="rounded-[1.6rem] border border-foreground/10 bg-[#ecece6]/70 p-5 md:p-6"
    >
      <motion.div variants={staggerItem} className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Section 02
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Asset Lifecycle Intelligence
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Physical movement and capital concentration across the twin lifecycle. Highlighted stages need attention.
        </p>
      </motion.div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:gap-0">
        {stages.map((stage, index) => (
          <motion.div key={stage.stage} variants={staggerItem} className="flex min-w-[148px] flex-1">
            <LifecycleStage item={stage} isLast={index === stages.length - 1} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
