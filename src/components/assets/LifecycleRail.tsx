"use client";

import { motion } from "framer-motion";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/types/asset";
import { getStageIndex } from "@/lib/lifecycle";
import { cn } from "@/lib/utils";

const RAIL_LABELS: Record<LifecycleStage, string> = {
  PURCHASE_ORDER: "PO",
  PROCUREMENT: "Procure",
  RAW_MATERIAL: "Raw",
  PRODUCTION: "Prod",
  FINISHED_GOODS: "Finished",
  IN_TRANSIT: "Transit",
  WAREHOUSE: "Warehouse",
  DELIVERED: "Delivered",
  INVOICE: "Invoice",
  RECEIVABLE: "AR",
  CASH_REALISED: "Cash",
};

export function LifecycleRail({
  currentStage,
  productionCompletion,
}: {
  currentStage: LifecycleStage;
  productionCompletion: number;
}) {
  const currentIndex = getStageIndex(currentStage);

  return (
    <section className="rounded-[1.6rem] border border-foreground/10 bg-white p-5 md:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Lifecycle
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">One identity. Every stage.</h2>
        </div>
        <p className="hidden max-w-xs text-right text-sm text-muted-foreground md:block">
          Completed stages stay on this twin. Capital does not reset when the box moves.
        </p>
      </div>
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {LIFECYCLE_STAGES.map((stage, index) => {
            const complete = index < currentIndex;
            const current = index === currentIndex;
            return (
              <motion.div
                key={stage}
                layout
                title={stage.replaceAll("_", " ")}
                className={cn(
                  "flex h-[92px] w-[5.6rem] shrink-0 flex-col justify-between rounded-[1.05rem] px-2.5 py-2.5 sm:w-[6.1rem]",
                  complete && "bg-ink text-white",
                  current && "bg-lime text-ink",
                  !complete && !current && "bg-[#f4f4f0] text-ink/45",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="font-display text-[12px] font-semibold leading-tight">{RAIL_LABELS[stage]}</p>
                <p className="text-[10px] font-medium">
                  {complete ? "Done" : current ? (stage === "PRODUCTION" ? `${productionCompletion}%` : "Now") : "Next"}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
