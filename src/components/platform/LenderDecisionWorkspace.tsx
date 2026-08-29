"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LenderContent } from "@/components/platform/LenderContent";
import { LenderDocumentsEvidence } from "@/components/platform/LenderDocumentsEvidence";
import { LenderOfferPanel } from "@/components/platform/LenderOfferPanel";
import { ExposureCapacityPanel } from "@/components/platform/ExposureCapacityPanel";
import { PhysicalGoodsLifecycleStepper } from "@/components/platform/PhysicalGoodsLifecycleStepper";
import { ProductionEventTimeline } from "@/components/platform/ProductionEventTimeline";
import { fetchOpportunity, submitLenderOffer, updateLenderOffer } from "@/lib/platform/hooks";
import { platformFetchAuth } from "@/lib/platform/client";
import type { ProductionRequest } from "@/types/platform";

interface LenderDecisionWorkspaceProps {
  requestId: string;
  token: string;
}

export function LenderDecisionWorkspace({ requestId, token }: LenderDecisionWorkspaceProps) {
  const [request, setRequest] = useState<ProductionRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [brief, setBrief] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchOpportunity(token, requestId).then(setRequest);
  }, [token, requestId]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!token) return;
    platformFetchAuth<{ content: string }>(token, "/ai/lender/underwriting-brief", {
      method: "POST",
      body: JSON.stringify({ production_request_id: requestId }),
    })
      .then((r) => setBrief(r.content))
      .catch(() => setBrief(null));
  }, [token, requestId]);

  async function submitOffer(payload: Parameters<typeof submitLenderOffer>[2]) {
    setLoading(true);
    setSuccess(null);
    try {
      const existing = request?.marketplace?.my_offer;
      if (existing?.id && existing.status === "PENDING") {
        await updateLenderOffer(token, requestId, existing.id, payload);
        setSuccess("Offer updated successfully.");
      } else {
        await submitLenderOffer(token, requestId, payload);
        setSuccess("Competitive offer submitted.");
      }
      load();
    } finally {
      setLoading(false);
    }
  }

  if (!request) {
    return <p className="text-muted-foreground">Loading offer workspace…</p>;
  }

  const sim = request.simulation_overlay;
  const displayStage = sim?.active ? sim.current_stage : request.current_stage;
  const displayProgress = sim?.active ? sim.production_progress : request.progress_pct;
  const marketplace = request.marketplace;

  return (
    <LenderContent className="space-y-6 pb-10">
      {sim?.active ? (
        <div className="rounded-lg border border-lime/25 bg-lime/5 px-4 py-2.5 text-sm">
          <span className="font-semibold text-ink">Simulation active</span>
          <span className="text-muted-foreground"> · Confidence {sim.confidence_score} · </span>
          <Link href="/lender/simulator" className="font-semibold text-lime-deep hover:underline">
            View simulator
          </Link>
        </div>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/8 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Offer workspace</p>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight md:text-3xl">{request.manufacturer_name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {request.project_name} · {request.request_code}
          </p>
        </div>
      </header>

      {success ? (
        <div className="rounded-lg border border-lime/30 bg-lime/10 px-4 py-2.5 text-sm font-medium text-ink">{success}</div>
      ) : null}

      {brief ? (
        <div className="rounded-[1.25rem] border border-foreground/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AI underwriting brief</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{brief}</p>
        </div>
      ) : null}

      {marketplace ? (
        <>
          <ExposureCapacityPanel
            snapshot={{
              maximum_safe_capacity:
                marketplace.maximum_safe_financing ??
                marketplace.maximum_safe_capacity ??
                0,
              active_exposure: marketplace.active_exposure ?? request.outstanding_exposure,
              reserved_exposure: marketplace.reserved_exposure ?? 0,
              total_consumed_capacity: marketplace.active_exposure ?? 0,
              remaining_available_capacity: marketplace.remaining_available_capacity ?? 0,
              utilization_percentage: marketplace.utilization_percentage ?? 0,
              over_financing_amount: marketplace.over_financing_amount ?? 0,
              risk_status: marketplace.risk_status ?? "HEALTHY",
              capacity_reasons: marketplace.capacity_reasons,
            }}
            variant="lender"
          />
          <LenderOfferPanel request={request} marketplace={marketplace} loading={loading} onSubmit={submitOffer} />
        </>
      ) : (
        <p className="text-muted-foreground">Marketplace context unavailable for this lender profile.</p>
      )}

      <PhysicalGoodsLifecycleStepper currentStage={displayStage} progress={displayProgress} variant="premium" />

      <ProductionEventTimeline events={request.events ?? []} />

      <LenderDocumentsEvidence documents={request.documents ?? []} />
    </LenderContent>
  );
}
