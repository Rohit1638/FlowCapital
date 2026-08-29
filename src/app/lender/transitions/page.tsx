"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { useRequireRole } from "@/lib/auth/auth-context";
import { fetchLenderTransitions } from "@/lib/platform/hooks";
import type { InstrumentTransitionSummary } from "@/types/platform";

function formatInstrument(code: string) {
  return code.replace(/_/g, " ");
}

export default function LenderTransitionsPage() {
  const auth = useRequireRole("LENDER");
  const [items, setItems] = useState<InstrumentTransitionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.token) return;
    fetchLenderTransitions(auth.token)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [auth.token]);

  return (
    <PlatformShell role="LENDER">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Module 3</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Financing Transitions</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review lifecycle-driven instrument transitions. Approval remains with the lender — the system only recommends.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading transitions…</p>
        ) : items.length === 0 ? (
          <div className="rounded-[1.25rem] border border-foreground/10 bg-white p-8 text-center text-sm text-muted-foreground">
            No transitions pending review.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((t) => (
              <motion.article
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.25rem] border border-foreground/10 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.request_code}</p>
                    <h2 className="mt-1 font-display text-lg font-semibold">{t.manufacturer_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t.transition_reason}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{t.status.replace(/_/g, " ")}</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-surface-2/50 p-4">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">From</p>
                    <p className="mt-1 font-semibold capitalize">{formatInstrument(t.from_instrument)}</p>
                    <p className="text-xs text-muted-foreground">{t.previous_lifecycle_stage?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowLeftRight className="h-6 w-6 text-lime-deep" />
                  </div>
                  <div className="rounded-xl bg-lime/10 p-4">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Recommended</p>
                    <p className="mt-1 font-semibold capitalize">{formatInstrument(t.to_instrument)}</p>
                    <p className="text-xs text-muted-foreground">{t.new_lifecycle_stage?.replace(/_/g, " ")}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>Suitability: {t.suitability_score}%</span>
                  <span>Confidence: {t.confidence_score ?? t.confidence_snapshot}%</span>
                </div>

                <Link
                  href={`/lender/transitions/${t.id}`}
                  className="mt-5 inline-flex rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
                >
                  Review transition
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
