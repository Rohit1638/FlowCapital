"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { useLiveAssets } from "@/lib/demo-store";
import { deriveCapitalOverview } from "@/lib/selectors";
import { staggerContainer } from "@/lib/motion";

export function CapitalOverview() {
  const assets = useLiveAssets();
  const capitalOverview = deriveCapitalOverview(assets);
  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Section 01
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Capital Overview</h2>
        </div>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-12"
      >
        <div className="lg:col-span-7">
          <MetricCard
            label="Assets Under Management"
            value={capitalOverview.assetsUnderManagement}
            changePct={capitalOverview.aumChangePct}
            variant="feature"
            footnote="Living twins across the active supply-chain book."
          />
        </div>
        <div className="grid gap-4 lg:col-span-5">
          <MetricCard
            label="Capital Deployed"
            value={capitalOverview.capitalDeployed}
            changePct={capitalOverview.deployedChangePct}
            variant="light"
            footnote="Currently attached to physical assets."
          />
          <MetricCard
            label="Available Financing"
            value={capitalOverview.availableFinancing}
            changePct={capitalOverview.availableChangePct}
            variant="lime"
            footnote="Headroom against approved limits."
          />
        </div>
        <div className="lg:col-span-12">
          <MetricCard
            label="Assets Requiring Attention"
            value={capitalOverview.assetsRequiringAttention}
            changePct={capitalOverview.attentionChangePct}
            format="count"
            variant="dark"
            footnote="Risk, delay, or leverage signals on the live book."
          />
        </div>
      </motion.div>
    </section>
  );
}
