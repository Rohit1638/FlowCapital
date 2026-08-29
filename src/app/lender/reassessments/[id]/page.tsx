"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { useRequireRole } from "@/lib/auth/auth-context";
import { acknowledgeReassessment, continueMonitoring, fetchReassessmentDetail, requestReassessmentEvidence } from "@/lib/platform/hooks";
import type { ReassessmentDetail } from "@/types/platform";
import { formatINRCompact } from "@/lib/format";

export default function LenderReassessmentDetailPage() {
  const auth = useRequireRole("LENDER");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ReassessmentDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.token) return;
    fetchReassessmentDetail(auth.token, params.id).then(setDetail);
  }, [auth.token, params.id]);

  async function act(action: "ack" | "monitor" | "evidence") {
    if (!auth.token) return;
    setLoading(true);
    try {
      if (action === "ack") await acknowledgeReassessment(auth.token, params.id, notes);
      else if (action === "monitor") await continueMonitoring(auth.token, params.id, notes);
      else await requestReassessmentEvidence(auth.token, params.id, notes);
      router.push("/lender/reassessments");
    } finally {
      setLoading(false);
    }
  }

  if (!detail) {
    return (
      <PlatformShell role="LENDER">
        <div className="p-8 text-sm text-muted-foreground">Loading…</div>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell role="LENDER">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <Link href="/lender/reassessments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <header>
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">{detail.request?.request_code}</p>
          <h1 className="font-display text-3xl font-semibold">Reassessment Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">Trigger: {detail.trigger_type.replace(/_/g, " ")}</p>
        </header>

        <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6">
          <h2 className="font-semibold">What happened?</h2>
          <p className="mt-2 text-sm text-muted-foreground">{detail.reason_summary}</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <StateCard title="Before" confidence={detail.previous_confidence} risk={detail.previous_risk} capacity={detail.previous_safe_capacity} remaining={detail.previous_remaining_capacity} instrument={detail.previous_instrument} />
          <StateCard title="After" confidence={detail.new_confidence} risk={detail.new_risk} capacity={detail.new_safe_capacity} remaining={detail.new_remaining_capacity} instrument={detail.new_recommended_instrument} highlight />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Recommended action</p>
          <p className="mt-1 text-sm text-amber-800">{detail.recommended_action.replace(/_/g, " ")} · {detail.impact_level.replace(/_/g, " ")}</p>
        </div>

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Review notes…" className="w-full rounded-xl border p-4 text-sm" rows={3} />
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={loading} onClick={() => act("ack")} className="rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink disabled:opacity-50">Acknowledge</button>
          <button type="button" disabled={loading} onClick={() => act("monitor")} className="rounded-full border px-6 py-3 text-sm font-semibold disabled:opacity-50">Continue monitoring</button>
          <button type="button" disabled={loading} onClick={() => act("evidence")} className="rounded-full border px-6 py-3 text-sm font-semibold disabled:opacity-50">Request evidence</button>
        </div>
      </div>
    </PlatformShell>
  );
}

function StateCard({ title, confidence, risk, capacity, remaining, instrument, highlight }: { title: string; confidence: number; risk: string; capacity: number; remaining: number; instrument?: string | null; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-[1.25rem] border-2 border-lime/40 bg-lime/5 p-6" : "rounded-[1.25rem] border border-foreground/10 bg-white p-6"}>
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{title}</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div><dt className="text-muted-foreground">Confidence</dt><dd className="font-display text-2xl font-semibold">{confidence}%</dd></div>
        <div><dt className="text-muted-foreground">Risk</dt><dd className="font-semibold">{risk}</dd></div>
        <div><dt className="text-muted-foreground">Safe capacity</dt><dd className="font-semibold">{formatINRCompact(capacity)}</dd></div>
        <div><dt className="text-muted-foreground">Remaining</dt><dd className="font-semibold">{formatINRCompact(remaining)}</dd></div>
        {instrument ? <div><dt className="text-muted-foreground">Instrument</dt><dd className="font-semibold capitalize">{instrument.replace(/_/g, " ")}</dd></div> : null}
      </dl>
    </div>
  );
}
