"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { LIFECYCLE_STAGES, type FinancingStatus, type LifecycleStage, type RiskLevel } from "@/types/asset";
import { formatCurrencyINR, formatRelativeTime, getLifecycleLabel } from "@/lib/format";
import { STAGE_LABELS } from "@/lib/lifecycle";
import { useLiveAssets } from "@/lib/demo-store";
import { deriveIntelligenceMetrics } from "@/lib/selectors";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SortKey = "value" | "risk" | "updated";

const selectClass =
  "h-10 rounded-full border border-foreground/12 bg-white px-3 text-sm outline-none focus-visible:border-foreground/30";

export function AssetIntelligence() {
  const assets = useLiveAssets();
  const metrics = deriveIntelligenceMetrics(assets);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<LifecycleStage | "ALL">("ALL");
  const [risk, setRisk] = useState<RiskLevel | "ALL">("ALL");
  const [financing, setFinancing] = useState<FinancingStatus | "ALL">("ALL");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<SortKey>("value");

  const categories = useMemo(
    () => Array.from(new Set(assets.map((asset) => asset.category))),
    [assets],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets
      .filter((asset) => {
        if (needle && !asset.id.toLowerCase().includes(needle) && !asset.name.toLowerCase().includes(needle)) {
          return false;
        }
        if (stage !== "ALL" && asset.currentStage !== stage) return false;
        if (risk !== "ALL" && asset.riskLevel !== risk) return false;
        if (financing !== "ALL" && asset.financingStatus !== financing) return false;
        if (category !== "ALL" && asset.category !== category) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "value") return b.currentValue - a.currentValue;
        if (sort === "risk") return b.riskScore - a.riskScore;
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
  }, [assets, query, stage, risk, financing, category, sort]);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="w-full">
      <PageHeader
        title="Asset Intelligence"
        description="Every physical asset. One continuous financial memory."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <MetricCard
            label="Total tracked assets"
            value={metrics.totalTracked}
            changePct={0}
            format="count"
            variant="feature"
            footnote="Persistent Digital Asset Twins on the book."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-6">
          <MetricCard
            label="Assets in motion"
            value={metrics.inMotion}
            changePct={0}
            format="count"
            variant="light"
            footnote="Production, procurement, transit."
          />
          <MetricCard
            label="Requiring attention"
            value={metrics.requiringAttention}
            changePct={0}
            format="count"
            variant="dark"
            footnote="Delay, mismatch, or receivable watch."
          />
          <MetricCard
            label="Total asset value"
            value={metrics.totalValue}
            changePct={4.2}
            variant="lime"
            footnote="Active book, excluding settled cash."
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-[1.4rem] border border-foreground/10 bg-white p-4 md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by Asset ID or name"
            className="pl-11"
            aria-label="Search assets"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <select className={selectClass} value={stage} onChange={(e) => setStage(e.target.value as LifecycleStage | "ALL")} aria-label="Filter by lifecycle stage">
            <option value="ALL">All stages</option>
            {LIFECYCLE_STAGES.map((item) => (
              <option key={item} value={item}>
                {STAGE_LABELS[item]}
              </option>
            ))}
          </select>
          <select className={selectClass} value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel | "ALL")} aria-label="Filter by risk">
            <option value="ALL">All risk</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select className={selectClass} value={financing} onChange={(e) => setFinancing(e.target.value as FinancingStatus | "ALL")} aria-label="Filter by financing status">
            <option value="ALL">All financing</option>
            <option value="UNFINANCED">Unfinanced</option>
            <option value="PARTIAL">Partial</option>
            <option value="FINANCED">Financed</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="SETTLED">Settled</option>
          </select>
          <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="ALL">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort assets">
            <option value="value">Sort by current value</option>
            <option value="risk">Sort by risk</option>
            <option value="updated">Sort by last updated</option>
          </select>
        </div>
      </div>

      <motion.div className="mt-5 overflow-hidden rounded-[1.6rem] border border-foreground/10 bg-white">
        <div className="hidden grid-cols-[1fr_1.4fr_1fr_1.1fr_0.8fr_0.7fr_0.9fr_0.8fr] gap-3 border-b border-foreground/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground xl:grid">
          <span>Asset ID</span>
          <span>Asset Name</span>
          <span>Category</span>
          <span>Lifecycle Stage</span>
          <span>Current Value</span>
          <span>Risk</span>
          <span>Financing</span>
          <span>Updated</span>
        </div>
        {filtered.map((asset) => (
          <motion.div key={asset.id} variants={staggerItem}>
            <Link
              href={`/assets/${asset.id}`}
              className="grid gap-3 border-b border-foreground/8 px-5 py-4 last:border-b-0 transition-colors hover:bg-[#f4f4f0] xl:grid-cols-[1fr_1.4fr_1fr_1.1fr_0.8fr_0.7fr_0.9fr_0.8fr] xl:items-center"
            >
              <p className="font-mono text-xs font-medium">{asset.id}</p>
              <div>
                <p className="text-sm font-semibold">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.owner}</p>
              </div>
              <p className="text-sm text-ink/70">{asset.category}</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    asset.attention ? "bg-ink" : "bg-lime",
                    asset.currentStage === "CASH_REALISED" && "bg-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">{getLifecycleLabel(asset.currentStage)}</span>
              </div>
              <p className="font-display text-lg font-semibold">{formatCurrencyINR(asset.currentValue)}</p>
              <RiskBadge level={asset.riskLevel} />
              <StatusBadge status={asset.financingStatus} />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{formatRelativeTime(asset.lastUpdated)}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-foreground/10">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">No twins match the current filters.</p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
