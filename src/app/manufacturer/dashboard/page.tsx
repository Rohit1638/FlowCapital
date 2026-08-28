"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { ManufacturerContent } from "@/components/platform/ManufacturerContent";
import { PlatformMetricCard } from "@/components/platform/PlatformMetricCard";
import { useRequireRole } from "@/lib/auth/auth-context";
import { formatINRCompact } from "@/lib/format";
import { fetchManufacturerDashboard } from "@/lib/platform/hooks";
import { normalizeLifecycleStage } from "@/lib/platform/lifecycle-stages";

export default function ManufacturerDashboardPage() {
  const auth = useRequireRole("MANUFACTURER");
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchManufacturerDashboard>> | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    fetchManufacturerDashboard(auth.token).then(setData);
  }, [auth.token]);

  const primaryRequest = data?.requests?.[0];
  const activeCount = String(data?.active_production_requests ?? 1).padStart(2, "0");
  const conflictCount = String(data?.open_conflicts ?? 1).padStart(2, "0");
  const confidence = data?.average_confidence_score ?? 68;
  const confidenceLabel = confidence >= 75 ? "Strong" : confidence >= 60 ? "Moderate" : "Low";

  return (
    <PlatformShell role="MANUFACTURER">
      <ManufacturerContent className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Manufacturer Overview</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Production & Financing Command</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track active production, collateral, funding requests, and financing capacity across your portfolio.
          </p>
        </header>

        {/* Row 1 — Primary business information */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformMetricCard
            variant="dark"
            label="Active Production"
            value={activeCount}
            subtext={
              primaryRequest
                ? `${primaryRequest.quantity.toLocaleString()} ${primaryRequest.product_name}`
                : "1,000 Electric Bikes"
            }
            footnote={primaryRequest?.request_code ?? "PR-EB-1000"}
          />
          <PlatformMetricCard
            variant="white"
            label="Funding Requested"
            value={formatINRCompact(data?.total_funding_requested ?? 5_000_000)}
            subtext="Across active production plans"
          />
          <PlatformMetricCard
            variant="lime"
            label="Approved Financing"
            value={formatINRCompact(data?.approved_financing ?? 2_000_000)}
            subtext="Conditional tranches released"
          />
          <PlatformMetricCard
            variant="white"
            label="Available Capacity"
            value={formatINRCompact(data?.available_financing_capacity || primaryRequest?.financeable_value || 0)}
            subtext="Estimated financeable headroom"
          />
        </div>

        {/* Row 2 — Intelligence / health */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformMetricCard
            variant="white"
            label="Confidence"
            value={confidence}
            subtext={confidenceLabel}
            footnote="Deterministic score"
          />
          <PlatformMetricCard
            variant="dark"
            label="Open Conflicts"
            value={conflictCount}
            subtext={`${data?.open_conflicts ?? 1} requires attention`}
          />
          <PlatformMetricCard
            variant="white"
            label="Production Progress"
            value={`${data?.production_progress_pct ?? 58}%`}
            subtext="Weighted across active plans"
          />
          <PlatformMetricCard
            variant="white"
            label="Capital Blocked"
            value={formatINRCompact(data?.capital_blocked ?? 2_000_000)}
            subtext="Exposure under open conflicts"
          />
        </div>

        {/* Active production section */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">Active Production</h2>
          <div className="space-y-4">
            {(data?.requests ?? []).map((req) => {
              const approved = req.decisions?.[0]?.approved_amount ?? data?.approved_financing ?? 0;
              const stageLabel = normalizeLifecycleStage(req.current_stage).replace(/_/g, " ");
              return (
                <motion.article
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[1.25rem] border border-foreground/10 bg-white p-6"
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.5fr))_auto] lg:items-center">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{req.request_code}</p>
                      <h3 className="mt-1 font-display text-xl font-semibold">{req.project_name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {req.quantity.toLocaleString()} units · {formatINRCompact(req.required_funding_amount)} requested
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Current Stage</p>
                      <p className="mt-1 font-semibold">{stageLabel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Confidence</p>
                      <p className="mt-1 font-display text-2xl font-semibold">{req.confidence_score}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Funding Status</p>
                      <p className="mt-1 font-semibold text-lime-deep">{formatINRCompact(approved)} approved</p>
                    </div>
                    <Link
                      href={`/manufacturer/production-plans/${req.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                    >
                      View Production
                    </Link>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-lime transition-all duration-700" style={{ width: `${req.progress_pct}%` }} />
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </ManufacturerContent>
    </PlatformShell>
  );
}
