"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePortfolioIntelligence } from "@/lib/intelligence/hooks";

export default function AlertsPage() {
  const assessments = usePortfolioIntelligence();
  const alerts = assessments.flatMap((item) => item.risk.alerts);

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Operations"
        title="Alerts"
        description="Deterministic risk alerts from the financing intelligence engine."
      />
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={`/intelligence/${alert.assetId}`}
            className="block rounded-[1.4rem] border border-foreground/10 bg-white px-5 py-4 hover:bg-[#f4f4f0]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide">
              {alert.severity} · {alert.status}
            </p>
            <p className="mt-1 font-display text-xl font-semibold">{alert.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
            <p className="mt-2 font-mono text-xs">{alert.assetId}</p>
          </Link>
        ))}
        {alerts.length === 0 ? (
          <p className="rounded-[1.4rem] bg-white px-5 py-8 text-sm text-muted-foreground">No active intelligence alerts.</p>
        ) : null}
      </div>
    </div>
  );
}
