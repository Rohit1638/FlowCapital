"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { LenderContent } from "@/components/platform/LenderContent";
import { useRequireRole } from "@/lib/auth/auth-context";
import { formatINRCompact } from "@/lib/format";
import { fetchOpportunities } from "@/lib/platform/hooks";
import type { OpportunitySummary } from "@/types/platform";
import { cn } from "@/lib/utils";

export default function LenderOpportunitiesPage() {
  const auth = useRequireRole("LENDER");
  const [items, setItems] = useState<OpportunitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.token) return;
    fetchOpportunities(auth.token)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [auth.token]);

  return (
    <PlatformShell role="LENDER">
      <LenderContent className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Capital marketplace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Financing opportunities</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Compete for verified supply-chain working capital. Offer terms remain private until the manufacturer selects a winner.
          </p>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading marketplace…</p>
        ) : items.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-foreground/15 bg-white p-12 text-center">
            <p className="font-display text-xl font-semibold">No eligible opportunities</p>
            <p className="mt-2 text-sm text-muted-foreground">No opportunities currently match your lending criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </LenderContent>
    </PlatformShell>
  );
}

function OpportunityCard({ item }: { item: OpportunitySummary }) {
  const eligible = item.eligible !== false && item.eligibility_status === "ELIGIBLE";
  const competition = item.competing_lender_count ?? item.competing_offer_count ?? 0;

  return (
    <article className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.manufacturer_name}</p>
          <h2 className="font-display text-2xl font-semibold">
            {item.product_name.toUpperCase()} — {item.quantity.toLocaleString()} units
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{item.project_name}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
            eligible ? "border-lime/40 bg-lime/10 text-lime-deep" : "border-foreground/10 text-muted-foreground",
          )}
        >
          {item.eligibility_status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Stage" value={(item.instrument_lifecycle_stage ?? item.current_stage).replace(/_/g, " ")} />
        <Metric label="Recommended instrument" value={(item.recommended_instrument ?? "—").replace(/_/g, " ")} highlight={item.lender_instrument_match !== false} />
        <Metric label="Suitability" value={item.instrument_suitability_score != null ? `${item.instrument_suitability_score}%` : "—"} />
        <Metric label="Confidence" value={`${item.confidence_score}%`} />
        <Metric label="Requested" value={formatINRCompact(item.requested_funding)} />
        <Metric label="Remaining capacity" value={formatINRCompact(item.remaining_available_capacity ?? item.recommended_max)} />
      </div>

      {item.lender_instrument_match === false ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {item.instrument_policy_note ?? "NOT MATCHED TO CURRENT POLICY — recommended instrument is outside your supported instruments."}
        </p>
      ) : null}

      {!eligible && item.eligibility_reason ? (
        <p className="mt-4 rounded-lg border border-foreground/8 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">{item.eligibility_reason}</p>
      ) : null}

      {competition > 0 ? (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="flex -space-x-2">
            {[0, 1, 2].slice(0, Math.min(competition, 3)).map((i) => (
              <span key={i} className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink text-[10px] font-bold text-lime">
                {String.fromCharCode(65 + i)}
              </span>
            ))}
          </span>
          <span className="font-medium text-ink">
            🔥 {item.competition_label ?? `${competition} other lender${competition !== 1 ? "s" : ""} reviewing`}
          </span>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Be the first to submit a competitive offer.</p>
      )}

      <div className="mt-6 flex justify-end">
        <Link
          href={`/lender/opportunities/${item.id}/decision`}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition",
            eligible ? "bg-lime text-ink hover:brightness-95" : "border border-foreground/15 text-muted-foreground",
          )}
        >
          {item.has_pending_offer ? "Review / update offer" : "Review opportunity"} →
        </Link>
      </div>
    </article>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-xl font-semibold", highlight && "text-lime-deep")}>{value}</p>
    </div>
  );
}
