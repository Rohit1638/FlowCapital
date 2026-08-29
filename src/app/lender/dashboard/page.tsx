"use client";

import { useEffect, useMemo, useState } from "react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { LenderContent } from "@/components/platform/LenderContent";
import { LenderResourceCards } from "@/components/platform/LenderResourceCards";
import { PlatformMetricCard } from "@/components/platform/PlatformMetricCard";
import { useRequireRole } from "@/lib/auth/auth-context";
import { formatINRCompact } from "@/lib/format";
import { fetchLenderDashboard } from "@/lib/platform/hooks";

export default function LenderDashboardPage() {
  const auth = useRequireRole("LENDER");
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchLenderDashboard>> | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    fetchLenderDashboard(auth.token).then(setData);
  }, [auth.token]);

  const opportunities = data?.opportunities ?? [];
  const pendingDecisions = data?.requests_under_review ?? opportunities.length;
  const fundingRequested = opportunities.reduce((s, o) => s + o.requested_funding, 0);
  const collateralTotal = opportunities.reduce((s, o) => s + o.verified_value * 0.75, 0);
  const collateralCoverage = fundingRequested > 0 ? Math.round((collateralTotal / fundingRequested) * 100) : 0;
  const pendingDocs = useMemo(
    () => opportunities.reduce((s, o) => s + Math.max(0, 4 - Math.round((o.document_completeness_pct / 100) * 4)), 0),
    [opportunities],
  );

  return (
    <PlatformShell role="LENDER">
      <LenderContent className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Lender overview</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Financing decision workspace</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor pending requests, exposure, confidence, and collateral before making financing decisions.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PlatformMetricCard label="Pending financing" value={String(pendingDecisions).padStart(2, "0")} variant="dark" />
          <PlatformMetricCard label="Funding requested" value={formatINRCompact(fundingRequested || 5_000_000)} />
          <PlatformMetricCard label="Approved financing" value={formatINRCompact(data?.total_approved_financing ?? 2_000_000)} variant="lime" />
          <PlatformMetricCard label="Capital deployed" value={formatINRCompact(data?.total_active_exposure ?? 2_000_000)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PlatformMetricCard label="Average confidence" value={data?.average_portfolio_confidence ?? 68} subtext="/ 100" />
          <PlatformMetricCard label="At-risk requests" value={data?.high_risk_exposures ?? 1} variant="dark" />
          <PlatformMetricCard label="Collateral coverage" value={`${collateralCoverage}%`} />
          <PlatformMetricCard label="Production exposure" value={formatINRCompact(data?.total_active_exposure ?? 2_000_000)} subtext="Active tranches" />
        </div>

        <LenderResourceCards pendingDocuments={pendingDocs || 1} pendingDecisions={pendingDecisions || 1} />
      </LenderContent>
    </PlatformShell>
  );
}
