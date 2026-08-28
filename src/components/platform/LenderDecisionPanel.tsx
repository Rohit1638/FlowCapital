"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatINRCompact } from "@/lib/format";
import { deriveLenderRecommendation, mapDecisionStatus } from "@/lib/platform/lender-recommendation";
import type { ProductionRequest } from "@/types/platform";
import { cn } from "@/lib/utils";

interface LenderDecisionPanelProps {
  request: ProductionRequest;
  loading: boolean;
  onApprove: (amount: number, reason?: string) => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
  onModify: (amount: number, reason: string) => Promise<void>;
}

export function LenderDecisionPanel({ request, loading, onApprove, onReject, onModify }: LenderDecisionPanelProps) {
  const recommendation = deriveLenderRecommendation(request);
  const [showModify, setShowModify] = useState(false);
  const [modifyAmount, setModifyAmount] = useState(recommendation.suggestedAmount);
  const [modifyReason, setModifyReason] = useState("");

  const latestApproved = request.decisions?.[request.decisions.length - 1]?.approved_amount ?? request.outstanding_exposure;
  const decisionStatus = mapDecisionStatus(request.status, request.decisions);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.375rem] border-2 border-lime/40 bg-ink p-7 text-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)] md:p-9"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime">Decision required</p>
          <h2 className="mt-1 font-display text-2xl font-semibold md:text-3xl">Financing decision</h2>
          <p className="mt-2 text-sm text-white/60">{request.manufacturer_name} · {request.request_code}</p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
          {decisionStatus}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Current confidence" value={`${request.confidence_score} / 100`} />
        <Metric label="Risk level" value={recommendation.riskLevel} accent="cyan" />
        <Metric label="Requested" value={formatINRCompact(request.required_funding_amount)} />
        <Metric label="Suggested exposure" value={formatINRCompact(recommendation.suggestedAmount)} accent="lime" />
        <Metric label="Collateral" value={formatINRCompact(recommendation.coveragePct > 0 ? request.collateral?.reduce((s, c) => s + c.estimated_value, 0) ?? 0 : 0)} />
        <Metric label="Coverage" value={`${recommendation.coveragePct}%`} />
        <Metric label="Production" value={`${request.progress_pct ?? 0}% complete`} accent="cyan" />
        <Metric label="Current exposure" value={formatINRCompact(latestApproved)} />
      </div>

      <div className="mt-8 rounded-[1.125rem] border border-white/10 bg-white/[0.04] p-6 md:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Recommended action</p>
        <p className="mt-2 font-display text-2xl font-semibold text-lime">{recommendation.action}</p>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{recommendation.summary}</p>
        <p className="mt-2 text-xs text-white/45">Decision support only — final lending action remains with the lender.</p>
      </div>

      {!showModify ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            variant="lime"
            size="lg"
            disabled={loading}
            className="min-w-[180px] font-semibold"
            onClick={() => onApprove(recommendation.suggestedAmount, "Approved based on recommended exposure and available evidence.")}
          >
            Approve financing
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={loading}
            className="min-w-[160px] border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => {
              setModifyAmount(recommendation.suggestedAmount);
              setShowModify(true);
            }}
          >
            Modify amount
          </Button>
          <Button
            variant="ghost"
            size="lg"
            disabled={loading}
            className="text-white/70 hover:bg-white/5 hover:text-white"
            onClick={() => onReject("Rejected after review of confidence, collateral, and production evidence.")}
          >
            Reject request
          </Button>
        </div>
      ) : (
        <div className="mt-8 rounded-[1.125rem] border border-white/15 bg-white/[0.03] p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/60">Modify financing amount</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Requested amount" value={formatINRCompact(request.required_funding_amount)} />
            <Field label="Recommended" value={formatINRCompact(recommendation.suggestedAmount)} />
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Approved amount</label>
              <input
                type="number"
                value={modifyAmount}
                onChange={(e) => setModifyAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-lime/50"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Reason</label>
            <textarea
              value={modifyReason}
              onChange={(e) => setModifyReason(e.target.value)}
              rows={3}
              placeholder="Explain adjustment to exposure…"
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-lime/50"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="lime"
              disabled={loading || !modifyReason.trim()}
              onClick={() => {
                onModify(modifyAmount, modifyReason);
                setShowModify(false);
              }}
            >
              Confirm financing
            </Button>
            <Button variant="ghost" className="text-white/70" onClick={() => setShowModify(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "lime" | "cyan" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className={cn("mt-1 font-display text-lg font-semibold", accent === "lime" && "text-lime", accent === "cyan" && "text-cyan-300")}>
        {value}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
