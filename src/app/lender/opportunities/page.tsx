"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { LenderContent } from "@/components/platform/LenderContent";
import { useRequireRole } from "@/lib/auth/auth-context";
import { formatINRCompact } from "@/lib/format";
import { fetchOpportunities } from "@/lib/platform/hooks";
import type { OpportunitySummary } from "@/types/platform";

export default function LenderOpportunitiesPage() {
  const auth = useRequireRole("LENDER");
  const [items, setItems] = useState<OpportunitySummary[]>([]);

  useEffect(() => {
    if (!auth.token) return;
    fetchOpportunities(auth.token).then(setItems);
  }, [auth.token]);

  const verifiedDocs = (pct: number) => Math.round((pct / 100) * 4);

  return (
    <PlatformShell role="LENDER">
      <LenderContent className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Financing requests</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Decision queue</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review confidence, collateral, and production evidence before approving exposure.</p>
        </header>

        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.manufacturer_name}</p>
                  <h2 className="font-display text-2xl font-semibold">{item.project_name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.product_name} · {item.quantity.toLocaleString()} units
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request {item.request_code}</p>
              </div>

              <div className="mt-5 grid gap-4 border-y border-foreground/8 py-5 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Requested</p>
                  <p className="mt-1 font-display text-2xl font-semibold">{formatINRCompact(item.requested_funding)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Confidence</p>
                  <p className="mt-1 font-display text-2xl font-semibold">{item.confidence_score}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recommended max</p>
                  <p className="mt-1 font-display text-2xl font-semibold">{formatINRCompact(item.recommended_max)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span>
                  Production: <strong className="text-ink">{item.current_stage.replace(/_/g, " ")}</strong>
                </span>
                <span>
                  Documents: <strong className="text-ink">{verifiedDocs(item.document_completeness_pct)} verified</strong>
                </span>
                <span>
                  Conflicts: <strong className="text-ink">{item.open_conflicts}</strong>
                </span>
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  href={`/lender/opportunities/${item.id}/decision`}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
                >
                  Review decision →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </LenderContent>
    </PlatformShell>
  );
}
