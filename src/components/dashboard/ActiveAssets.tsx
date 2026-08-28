"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLiveAssets } from "@/lib/demo-store";
import { formatINRCompact } from "@/lib/format";
import { staggerContainer, staggerItem } from "@/lib/motion";

export function ActiveAssets() {
  const assets = useLiveAssets();
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Section 04
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Active Assets</h2>
        </div>
        <Link href="/assets" className="text-sm font-medium text-ink/60 hover:text-ink">
          View all twins
        </Link>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="overflow-hidden rounded-[1.6rem] border border-foreground/10 bg-white"
      >
        <div className="hidden grid-cols-[1.1fr_1.3fr_1.1fr_0.8fr_0.7fr_0.9fr_auto] gap-3 border-b border-foreground/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
          <span>Asset ID</span>
          <span>Asset Name</span>
          <span>Current Stage</span>
          <span>Current Value</span>
          <span>Risk</span>
          <span>Financing Status</span>
          <span>Action</span>
        </div>
        {assets.map((asset) => (
          <motion.div key={asset.id} variants={staggerItem}>
            <Link
              href={`/assets/${asset.id}`}
              className="grid gap-3 border-b border-foreground/8 px-5 py-4 last:border-b-0 transition-colors hover:bg-[#f4f4f0] lg:grid-cols-[1.1fr_1.3fr_1.1fr_0.8fr_0.7fr_0.9fr_auto] lg:items-center"
            >
              <p className="font-mono text-xs font-medium">{asset.id}</p>
              <div>
                <p className="text-sm font-semibold">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.category}</p>
              </div>
              <StatusBadge stage={asset.currentStage} />
              <p className="font-display text-lg font-semibold">{formatINRCompact(asset.currentValue)}</p>
              <RiskBadge level={asset.riskLevel} />
              <StatusBadge status={asset.financingStatus} />
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
