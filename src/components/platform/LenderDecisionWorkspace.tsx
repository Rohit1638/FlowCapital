"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LenderCollateralSummary } from "@/components/platform/LenderCollateralSummary";
import { LenderContent, LenderSection } from "@/components/platform/LenderContent";
import { LenderDecisionPanel } from "@/components/platform/LenderDecisionPanel";
import { LenderDocumentsEvidence } from "@/components/platform/LenderDocumentsEvidence";
import { PhysicalGoodsLifecycleStepper } from "@/components/platform/PhysicalGoodsLifecycleStepper";
import { PlatformMetricCard } from "@/components/platform/PlatformMetricCard";
import { ProductionEventTimeline } from "@/components/platform/ProductionEventTimeline";
import { formatINRCompact } from "@/lib/format";
import { deriveLenderRecommendation, mapDecisionStatus, totalCollateralValue } from "@/lib/platform/lender-recommendation";
import { platformFetchAuth } from "@/lib/platform/client";
import { fetchOpportunity } from "@/lib/platform/hooks";
import type { ProductionRequest } from "@/types/platform";

interface LenderDecisionWorkspaceProps {
  requestId: string;
  token: string;
}

export function LenderDecisionWorkspace({ requestId, token }: LenderDecisionWorkspaceProps) {
  const [request, setRequest] = useState<ProductionRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchOpportunity(token, requestId).then(setRequest);
  }, [token, requestId]);

  useEffect(load, [load]);

  async function submitDecision(decision_type: string, approved_amount: number, reason: string) {
    setLoading(true);
    setSuccess(null);
    try {
      await platformFetchAuth(token, `/lender/requests/${requestId}/decide`, {
        method: "POST",
        body: JSON.stringify({
          decision_type,
          approved_amount,
          instrument: "PRODUCTION_FINANCING",
          reason,
          conditions: decision_type === "CONDITIONALLY_APPROVE" ? ["Independent verification required"] : [],
        }),
      });
      setSuccess("Decision recorded and saved.");
      load();
    } finally {
      setLoading(false);
    }
  }

  if (!request) {
    return <p className="text-muted-foreground">Loading decision workspace…</p>;
  }

  const recommendation = deriveLenderRecommendation(request);
  const collateral = totalCollateralValue(request);
  const decisionStatus = mapDecisionStatus(request.status, request.decisions);

  return (
    <LenderContent className="space-y-8 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Financing decision</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{request.manufacturer_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {request.project_name} · Request {request.request_code}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="mt-1 font-display text-lg font-semibold">{decisionStatus}</p>
        </div>
      </header>

      {success ? (
        <div className="rounded-xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm font-medium text-ink">{success}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <LenderDecisionPanel
          request={request}
          loading={loading}
          onApprove={(amount, reason) =>
            submitDecision(
              amount >= request.required_funding_amount ? "APPROVE" : "CONDITIONALLY_APPROVE",
              amount,
              reason ?? "Approved based on recommended exposure.",
            )
          }
          onReject={(reason) => submitDecision("REJECT", 0, reason ?? "Rejected after review.")}
          onModify={(amount, reason) =>
            submitDecision(amount >= request.required_funding_amount ? "APPROVE" : "PARTIALLY_APPROVE", amount, reason)
          }
        />
        <aside className="space-y-4">
          <PlatformMetricCard label="Funding requested" value={formatINRCompact(request.required_funding_amount)} variant="white" />
          <PlatformMetricCard label="Confidence" value={`${request.confidence_score}`} subtext="/ 100" variant="dark" badge={recommendation.action.split(" ")[0]} />
          <PlatformMetricCard label="Collateral" value={formatINRCompact(collateral)} subtext={`${recommendation.coveragePct}% coverage`} variant="white" />
        </aside>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlatformMetricCard label="Funding" value={formatINRCompact(request.required_funding_amount)} />
        <PlatformMetricCard label="Confidence" value={request.confidence_score} subtext="/ 100" variant="lime" />
        <PlatformMetricCard label="Collateral" value={formatINRCompact(collateral)} />
        <PlatformMetricCard label="Production" value={`${request.progress_pct ?? 0}%`} subtext={request.current_stage.replace(/_/g, " ")} variant="dark" />
      </div>

      <LenderSection title="Lifecycle tracker" eyebrow="Physical goods">
        <PhysicalGoodsLifecycleStepper currentStage={request.current_stage} progress={request.progress_pct} />
      </LenderSection>

      <ProductionEventTimeline events={request.events ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LenderDocumentsEvidence documents={request.documents ?? []} />
        <LenderCollateralSummary request={request} />
      </div>

      <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">AI intelligence</p>
            <h3 className="mt-1 font-display text-xl font-semibold">Structured underwriting insights</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Ask FlowCapital AI about risks, confidence drivers, collateral adequacy, and production evidence before confirming a decision.
            </p>
          </div>
          <Link
            href={`/lender/ai-assistant?request=${requestId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            <Sparkles className="h-4 w-4" />
            Open AI Assistant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-0 lg:grid-cols-3">
          <Insight label="Assessment" value={recommendation.action} />
          <Insight label="Suggested exposure" value={formatINRCompact(recommendation.suggestedAmount)} />
          <Insight label="Open conflicts" value={String(request.open_conflicts ?? 0)} />
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-foreground/10 bg-surface-2/50 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Manufacturer</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm">
          <div><p className="text-muted-foreground">Company</p><p className="font-semibold">{request.manufacturer_name}</p></div>
          <div><p className="text-muted-foreground">Industry</p><p className="font-semibold">{request.product_category}</p></div>
          <div><p className="text-muted-foreground">Production</p><p className="font-semibold">{request.quantity.toLocaleString()} units</p></div>
          <div><p className="text-muted-foreground">Current stage</p><p className="font-semibold">{request.current_stage.replace(/_/g, " ")}</p></div>
        </div>
      </section>

      {(request.decisions?.length ?? 0) > 0 ? (
        <LenderSection title="Decision audit trail" eyebrow="History">
          <div className="space-y-3">
            {request.decisions!.map((d) => (
              <div key={d.id} className="rounded-xl border border-foreground/10 bg-white px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{d.decision_type.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{d.lender_name ?? "Lender"}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Approved {formatINRCompact(d.approved_amount)} · {d.reason}
                </p>
              </div>
            ))}
          </div>
        </LenderSection>
      ) : null}
    </LenderContent>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-foreground/8 bg-surface-2 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
