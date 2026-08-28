"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { Asset } from "@/types/asset";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatRelativeTime, getLifecycleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PassportHeader({ asset }: { asset: Asset }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assets
        </Link>
        <p className="mt-4 font-mono text-sm tracking-wide text-ink/50">{asset.id}</p>
        <h1 className="mt-1 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {asset.name}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            {asset.status}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-lime px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-ink"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            {getLifecycleLabel(asset.currentStage)}
          </span>
        </div>
      </div>
      <div className="rounded-[1.4rem] border border-foreground/10 bg-white px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Risk score</p>
        <div className="mt-2 flex items-end gap-3">
          <motion.p
            key={asset.riskScore}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("font-display text-4xl font-semibold", asset.riskLevel === "HIGH" && "text-ink")}
          >
            {asset.riskScore}
            <span className="text-lg text-muted-foreground"> / 100</span>
          </motion.p>
          <RiskBadge level={asset.riskLevel} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Last updated {formatRelativeTime(asset.lastUpdated)}</p>
      </div>
    </div>
  );
}
