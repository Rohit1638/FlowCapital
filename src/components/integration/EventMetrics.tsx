"use client";

import { motion } from "framer-motion";
import { useEventMetrics } from "@/lib/integration/store";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const tiles = [
  { key: "received" as const, label: "Events received", tone: "dark" },
  { key: "applied" as const, label: "Successfully applied", tone: "lime" },
  { key: "conflicts" as const, label: "Conflicts detected", tone: "ink" },
  { key: "rejected" as const, label: "Rejected events", tone: "light" },
];

export function EventMetrics() {
  const metrics = useEventMetrics();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {tiles.map((tile) => (
        <motion.article
          key={tile.key}
          variants={staggerItem}
          className={cn(
            "rounded-[1.4rem] p-5",
            tile.tone === "dark" && "bg-ink text-white",
            tile.tone === "lime" && "bg-lime text-ink",
            tile.tone === "ink" && "bg-ink-2 text-white",
            tile.tone === "light" && "border border-foreground/10 bg-white",
          )}
        >
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em]", tile.tone === "light" ? "text-muted-foreground" : "opacity-60")}>
            {tile.label}
          </p>
          <p className={cn("mt-4 font-display text-4xl font-semibold", tile.tone === "lime" && "text-ink", tile.tone === "dark" && "text-lime")}>
            {String(metrics[tile.key]).padStart(2, "0")}
          </p>
        </motion.article>
      ))}
    </motion.div>
  );
}
