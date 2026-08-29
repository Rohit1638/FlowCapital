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
  const collateral = request.collateral?.reduce((s, c) => s + c.estimated_value, 0) ?? 0;
  const decisionStatus = mapDecisionStatus(request.status, request.decisions);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.375rem] border border-lime/30 bg-ink p-6 text-white shadow-lg md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime">Decision required</p>
          <h2 className="mt-1 font-display text-xl font-semibold md:text-2xl">Financing decision</h2>
          <p className="mt-1 text-sm text-white/55">{request.manufacturer_name} · {request.request_code}</p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          {decisionStatus}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Confidence" value={`${request.confidence_score} / 100`} />
        <Metric label="Risk" value={recommendation.riskLevel} accent="lime" />
        <Metric label="Requested" value={formatINRCompact(request.required_funding_amount)} />
        <Metric label="Suggested" value={formatINRCompact(recommendation.suggestedAmount)} accent="lime" />
        <Metric label="Collateral" value={formatINRCompact(collateral)} />
        <Metric label="Coverage" value={`${recommendation.coveragePct}%`} />
        <Metric label="Production" value={`${request.progress_pct ?? 0}%`} />
        <Metric label="Exposure" value={formatINRCompact(request.outstanding_exposure)} />
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Recommended action</p>
        <p className="mt-1 font-display text-xl font-semibold text-lime">{recommendation.action}</p>
        <p className="mt-2 text-sm leading-relaxed text-white/65">{recommendation.summary}</p>
      </div>

      {!showModify ? (
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <Button
            variant="lime"
            size="lg"
            disabled={loading}
            className="w-full min-w-[160px] font-semibold sm:w-auto"
            onClick={() => onApprove(recommendation.suggestedAmount, "Approved based on recommended exposure.")}
          >
            Approve financing
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={loading}
            className="w-full min-w-[140px] border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
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
            className="w-full text-white/60 hover:bg-white/5 hover:text-white sm:w-auto"
            onClick={() => onReject("Rejected after review.")}
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Modify amount</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Requested" value={formatINRCompact(request.required_funding_amount)} />
            <Field label="Recommended" value={formatINRCompact(recommendation.suggestedAmount)} />
            <div>
              <label className="text-[10px] font-semibold uppercase text-white/45">Approved</label>
              <input
                type="number"
                value={modifyAmount}
                onChange={(e) => setModifyAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-lime/50"
              />
            </div>
          </div>
          <textarea
            value={modifyReason}
            onChange={(e) => setModifyReason(e.target.value)}
            rows={2}
            placeholder="Reason for adjustment…"
            className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-lime/50"
          />
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="lime" disabled={loading || !modifyReason.trim()} onClick={() => { onModify(modifyAmount, modifyReason); setShowModify(false); }}>
              Confirm
            </Button>
            <Button variant="ghost" className="text-white/60" onClick={() => setShowModify(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "lime" }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className={cn("mt-0.5 font-display text-base font-semibold", accent === "lime" && "text-lime")}>{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase text-white/45">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
