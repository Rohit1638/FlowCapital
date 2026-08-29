"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CollateralGraph } from "@/components/platform/CollateralGraph";
import { DocumentsEvidence } from "@/components/platform/DocumentsEvidence";
import { ManufacturerContent, ManufacturerSection } from "@/components/platform/ManufacturerContent";
import { PhysicalGoodsLifecycleStepper } from "@/components/platform/PhysicalGoodsLifecycleStepper";
import { ProductionReportSection } from "@/components/platform/ProductionReportSection";
import { formatINRCompact } from "@/lib/format";
import { normalizeLifecycleStage } from "@/lib/platform/lifecycle-stages";
import type { ProductionRequest } from "@/types/platform";

interface ProductionRequestDetailProps {
  request: ProductionRequest;
  token: string;
  onRefresh: () => void;
}

export function ProductionRequestDetail({ request, token, onRefresh }: ProductionRequestDetailProps) {
  const approvedAmount = request.decisions?.[0]?.approved_amount ?? 0;
  const collateralValue = (request.collateral ?? []).reduce((sum, c) => sum + c.estimated_value, 0);

  return (
    <ManufacturerContent className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{request.request_code}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{request.project_name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {request.product_name} · {request.quantity.toLocaleString()} units
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-foreground/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
            {request.status.replace(/_/g, " ")}
          </span>
          <Link
            href={`/manufacturer/financing-request/${request.id}/offers`}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:brightness-95"
          >
            Compare lender offers
          </Link>
          <Link
            href="/manufacturer/ai-assistant"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-lime hover:text-ink"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Open AI Assistant
          </Link>
        </div>
      </header>

      <PhysicalGoodsLifecycleStepper currentStage={request.current_stage} progress={request.progress_pct} variant="premium" />

      <ManufacturerSection title="Production Summary">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Product", request.product_name],
            ["Quantity", request.quantity.toLocaleString()],
            ["Requested", formatINRCompact(request.required_funding_amount)],
            ["Approved", approvedAmount > 0 ? formatINRCompact(approvedAmount) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.25rem] border border-foreground/10 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </ManufacturerSection>

      <ManufacturerSection title="Asset / Collateral">
        <CollateralGraph request={request} />
        <p className="text-sm text-muted-foreground">
          Total collateral value: <span className="font-semibold text-ink">{formatINRCompact(collateralValue)}</span>
        </p>
      </ManufacturerSection>

      <ManufacturerSection title="Financial Position">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Confidence", `${request.confidence_score} — ${request.risk_level}`],
            ["Financeable", formatINRCompact(request.financeable_value)],
            ["Exposure", formatINRCompact(request.outstanding_exposure)],
            ["Verified value", formatINRCompact(request.verified_value)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.25rem] border border-foreground/10 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </ManufacturerSection>

      <DocumentsEvidence
        documents={request.documents ?? []}
        token={token}
        requestId={request.id}
        onRefresh={onRefresh}
      />

      {(request.conflicts ?? []).length > 0 ? (
        <ManufacturerSection title="Conflicts / Alerts">
          <div className="space-y-3">
            {(request.conflicts ?? []).map((c) => (
              <div key={c.conflict_code} className="rounded-[1.25rem] border border-destructive/20 bg-destructive/5 p-5 text-sm">
                <p className="font-semibold text-destructive">{c.conflict_type.replace(/_/g, " ")}</p>
                <p className="mt-1">{c.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Expected {c.expected_value} · Actual {c.actual_value}
                </p>
              </div>
            ))}
          </div>
        </ManufacturerSection>
      ) : null}

      <ProductionReportSection token={token} requestId={request.id} />
    </ManufacturerContent>
  );
}
