"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { useRequireRole } from "@/lib/auth/auth-context";
import {
  approveTransition,
  fetchTransitionDetail,
  keepCurrentTransition,
  rejectTransition,
  requestTransitionEvidence,
} from "@/lib/platform/hooks";
import type { InstrumentTransitionDetail } from "@/types/platform";

function formatInstrument(code: string) {
  return code.replace(/_/g, " ");
}

export default function LenderTransitionDetailPage() {
  const auth = useRequireRole("LENDER");
  const params = useParams();
  const router = useRouter();
  const transitionId = params.id as string;
  const [detail, setDetail] = useState<InstrumentTransitionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token) return;
    fetchTransitionDetail(auth.token, transitionId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [auth.token, transitionId]);

  async function runAction(action: "approve" | "keep" | "reject" | "evidence") {
    if (!auth.token) return;
    setActionLoading(true);
    setError(null);
    try {
      if (action === "approve") await approveTransition(auth.token, transitionId, notes);
      else if (action === "keep") await keepCurrentTransition(auth.token, transitionId, notes);
      else if (action === "reject") await rejectTransition(auth.token, transitionId, notes);
      else await requestTransitionEvidence(auth.token, transitionId, notes);
      router.push("/lender/transitions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <PlatformShell role="LENDER">
        <div className="p-8 text-sm text-muted-foreground">Loading…</div>
      </PlatformShell>
    );
  }

  if (!detail) {
    return (
      <PlatformShell role="LENDER">
        <div className="p-8">Transition not found.</div>
      </PlatformShell>
    );
  }

  const reviewed = !["PENDING_REVIEW", "DETECTED"].includes(detail.status);

  return (
    <PlatformShell role="LENDER">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <Link href="/lender/transitions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to transitions
        </Link>

        <header>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{detail.request?.request_code}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Transition Review</h1>
          <p className="mt-2 text-sm text-muted-foreground">{detail.request?.project_name}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-[1.25rem] border border-foreground/10 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Current financing</p>
            <p className="mt-2 font-display text-xl font-semibold capitalize">{formatInstrument(detail.from_instrument)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Stage: {detail.previous_lifecycle_stage?.replace(/_/g, " ")}</p>
          </div>

          <div className="flex flex-col items-center justify-center px-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Why recommended</p>
            <ul className="mt-3 space-y-2 text-sm">
              {(detail.recommendation_reasons ?? []).map((r) => (
                <li key={r} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-deep" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{detail.deterministic_note}</p>
          </div>

          <div className="rounded-[1.25rem] border-2 border-lime/40 bg-lime/5 p-6">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Recommended financing</p>
            <p className="mt-2 font-display text-xl font-semibold capitalize">{formatInstrument(detail.to_instrument)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Stage: {detail.new_lifecycle_stage?.replace(/_/g, " ")}</p>
            <p className="mt-3 text-sm font-semibold text-lime-deep">Suitability: {detail.suitability_score}%</p>
          </div>
        </div>

        <div className="rounded-xl border border-foreground/10 bg-white p-4 text-sm">
          <p className="font-semibold">Transition reason</p>
          <p className="mt-1 text-muted-foreground">{detail.transition_reason}</p>
        </div>

        {!reviewed ? (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional review notes…"
              className="w-full rounded-xl border border-foreground/10 p-4 text-sm"
              rows={3}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction("approve")}
                className="rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Approve transition
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction("keep")}
                className="rounded-full border border-foreground/15 px-6 py-3 text-sm font-semibold disabled:opacity-50"
              >
                Keep current
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction("evidence")}
                className="rounded-full border border-foreground/15 px-6 py-3 text-sm font-semibold disabled:opacity-50"
              >
                Request evidence
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction("reject")}
                className="rounded-full border border-destructive/30 px-6 py-3 text-sm font-semibold text-destructive disabled:opacity-50"
              >
                Reject transition
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">This transition has been reviewed ({detail.status.replace(/_/g, " ")}).</p>
        )}
      </div>
    </PlatformShell>
  );
}
